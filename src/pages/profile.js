import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/router";
import {
  Loader2,
  User,
  Mail,
  Trash2,
  PlusCircle,
  Save,
  Phone,
  MapPin,
  LocateFixed,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const libraries = ["places"];
const COUNTRY_DATA = [
  {
    country: "India",
    code: "+91",
    flag: "🇮🇳",
    lat: 20.5937,
    lng: 78.9629,
    iso2: "IN",
  },
].sort((a, b) => a.country.localeCompare(b.country));

function getUserInfoFromToken() {
  if (typeof window === "undefined") return { isLoggedIn: false };
  const token = localStorage.getItem("token");
  if (!token) return { isLoggedIn: false };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      isLoggedIn: true,
      name: payload.email || payload.name || "Customer",
    };
  } catch (e) {
    return { isLoggedIn: false };
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  const [sessionUser] = useState(getUserInfoFromToken());

  // --- SETUP MODE LOGIC ---
  const isSetupMode = router.query.setup === "true";
  const isProfileComplete =
    phone && phone.trim().length > 0 && addresses.length > 0;

  useEffect(() => {
    if (!sessionUser.isLoggedIn) {
      router.replace("/login");
      return;
    }

    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile data.");
        const { user: userData } = await res.json();

        setUser(userData);
        setName(userData.name || "");
        setPhone(userData.phone || "");
        setAddresses(userData.addresses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [sessionUser.isLoggedIn, router]);

  // SEPARATED SAVE FUNCTION FOR REUSE
  const performSave = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, phone, addresses }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update profile.");
    }

    const { user: updatedUser } = await res.json();
    setUser(updatedUser);
    setPhone(updatedUser.phone);
    setAddresses(updatedUser.addresses);
    return true; // Success
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await performSave();
      alert("Profile updated successfully! ✅");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSave = (newAddress) => {
    const newAddresses = [...addresses];
    if (editingIndex > -1) {
      newAddresses[editingIndex] = newAddress;
    } else {
      newAddresses.push(newAddress);
    }
    setAddresses(newAddresses);
    setIsModalOpen(false);
  };

  const handleAddAddress = () => {
    // FIX: Use current state 'name' and 'phone' variables for auto-fill
    const defaultNameParts = name ? name.split(" ") : [];
    setEditingAddress({
      label: "Home",
      firstName: defaultNameParts[0] || "",
      lastName: defaultNameParts.slice(1).join(" ") || "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: COUNTRY_DATA[0].country,
      phone: phone || "", // Use the currently entered phone number
      countryCode: COUNTRY_DATA[0].code,
      location: { type: "Point", coordinates: [0, 0] },
    });
    setEditingIndex(-1);
    setIsModalOpen(true);
  };

  const handleEditAddress = (addr, index) => {
    setEditingAddress(addr);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const removeAddress = (index) => {
    if (window.confirm("Are you sure you want to remove this address?")) {
      setAddresses(addresses.filter((_, i) => i !== index));
    }
  };

  // FIX: Handler now saves first, then redirects
  const handleFinishSetup = async () => {
    setIsSaving(true);
    try {
      await performSave(); // Save current state (phone/name/addresses) before leaving

      if (user.role === "RETAILER") router.push("/retailer/dashboard");
      else if (user.role === "WHOLESALER") router.push("/wholesaler/dashboard");
      else router.push("/");
    } catch (err) {
      setError("Failed to save details: " + err.message);
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!user)
    return (
      <div className="p-10">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load user profile.</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <User className="mr-3 h-6 w-6" /> My Profile
        </h1>

        {/* --- SETUP MODE BANNER --- */}
        {isSetupMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              Welcome to LiveMart!
            </h2>
            <p className="text-blue-700 mb-4">
              To start selling or stocking products, please complete your
              profile by adding a <strong>Phone Number</strong> and at least one{" "}
              <strong>Address</strong>.
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div
                className={`flex items-center gap-2 font-medium ${
                  phone ? "text-green-600" : "text-gray-400"
                }`}
              >
                <CheckCircle className="w-5 h-5" /> Phone Number
              </div>
              <div
                className={`flex items-center gap-2 font-medium ${
                  addresses.length > 0 ? "text-green-600" : "text-gray-400"
                }`}
              >
                <CheckCircle className="w-5 h-5" /> Address Added
              </div>
            </div>

            <Button
              onClick={handleFinishSetup}
              disabled={!isProfileComplete || isSaving}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isProfileComplete
                ? "Finish Setup & Go to Dashboard →"
                : "Complete Profile to Continue"}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number{" "}
                  {isSetupMode && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="Your contact number"
                    required={isSetupMode}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Shipping Addresses
                <Button
                  type="button"
                  onClick={handleAddAddress}
                  variant="secondary"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Address
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your saved delivery and billing addresses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 && (
                <p className="text-muted-foreground italic">
                  No addresses saved.
                </p>
              )}
              {addresses.map((addr, index) => (
                <div
                  key={addr._id || index}
                  className="border p-4 rounded-lg bg-white space-y-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-base flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      {addr.label || "Other"}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {addr.addressLine1} {addr.addressLine2}, {addr.city} -{" "}
                      {addr.pincode} ({addr.country})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recipient: {addr.firstName} {addr.lastName} | Phone:{" "}
                      {addr.countryCode} {addr.phone || "N/A"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => handleEditAddress(addr, index)}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => removeAddress(index)}
                      variant="ghost"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}{" "}
              Save Changes
            </Button>
          </div>
        </form>

        <AddressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddressSave}
          initialAddress={editingAddress}
          isNew={editingIndex === -1}
        />
      </div>
    </div>
  );
}

// --- Address Modal (Unchanged) ---
function AddressModal({ isOpen, onClose, onSave, initialAddress, isNew }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [address, setAddress] = useState(initialAddress || {});
  const defaultCenter = useMemo(() => ({ lat: 21.1458, lng: 79.0882 }), []);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const addressSearchSetValueRef = useRef(null);
  const hasManualLocationRef = useRef(false);

  const updateLocationAndAddress = useCallback(async (lat, lng, pan = true) => {
    const latLng = { lat, lng };
    setMarkerPosition(latLng);
    setMapCenter(latLng);
    try {
      const results = await getGeocode({ location: latLng });
      const components = results[0]?.address_components || [];
      const addressDescription =
        results[0]?.formatted_address || "Pinned Location";
      if (addressSearchSetValueRef.current)
        addressSearchSetValueRef.current(addressDescription, false);
      let newAddr = {
        addressLine1: addressDescription.split(",")[0].trim(),
        city: "",
        state: "",
        country: "",
        pincode: "",
        location: { type: "Point", coordinates: [lng, lat] },
      };
      let countryCodeFound = "";
      for (const component of components) {
        if (component.types.includes("locality"))
          newAddr.city = component.long_name;
        if (component.types.includes("administrative_area_level_1"))
          newAddr.state = component.short_name;
        if (component.types.includes("country")) {
          newAddr.country = component.long_name;
          countryCodeFound = component.short_name;
        }
        if (component.types.includes("postal_code"))
          newAddr.pincode = component.long_name;
      }
      if (!newAddr.addressLine1)
        newAddr.addressLine1 = addressDescription.split(",")[0].trim();
      const phoneCodeObj = countryCodeFound
        ? COUNTRY_DATA.find((c) => c.iso2 === countryCodeFound)
        : null;
      setAddress((prev) => ({
        ...prev,
        ...newAddr,
        countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode,
      }));
      if (mapRef.current && pan) mapRef.current.panTo(latLng);
    } catch (error) {
      setAddress((prev) => ({
        ...prev,
        location: { type: "Point", coordinates: [lng, lat] },
      }));
    }
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (hasManualLocationRef.current) {
          setIsLocating(false);
          return;
        }
        const { latitude, longitude } = position.coords;
        updateLocationAndAddress(latitude, longitude, true);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [updateLocationAndAddress, isLoaded, defaultCenter, address.countryCode]);

  useEffect(() => {
    const initial = initialAddress || {
      label: "Home",
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      phone: "",
      countryCode: COUNTRY_DATA[0].code,
      location: { type: "Point", coordinates: [0, 0] },
    };
    setAddress(initial);
    hasManualLocationRef.current = false;
    const initialCoords = initial.location?.coordinates;
    if (
      initialCoords &&
      initialCoords[0] &&
      initialCoords[1] &&
      initialCoords[0] !== 0
    ) {
      const [lng, lat] = initialCoords;
      setMarkerPosition({ lat, lng });
      setMapCenter({ lat, lng });
    } else {
      setMarkerPosition(null);
      setMapCenter(defaultCenter);
    }
  }, [initialAddress, defaultCenter]);

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      const hasInitialCoords =
        initialAddress?.location?.coordinates &&
        initialAddress.location.coordinates[0] !== 0;
      if (hasInitialCoords) {
        const [lng, lat] = initialAddress.location.coordinates;
        map.panTo({ lat, lng });
      }
    },
    [initialAddress]
  );

  const handlePlaceSelect = useCallback(
    (addressDescription, latLng) => {
      hasManualLocationRef.current = true;
      updateLocationAndAddress(latLng.lat, latLng.lng);
    },
    [updateLocationAndAddress]
  );
  const handleMapClick = useCallback(
    (e) => {
      hasManualLocationRef.current = true;
      updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
    },
    [updateLocationAndAddress]
  );
  const handleMarkerDragEnd = useCallback(
    (e) => {
      hasManualLocationRef.current = true;
      updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
    },
    [updateLocationAndAddress]
  );
  const handleCountryNameSelect = useCallback((selectedCountryName) => {
    const selectedCountry = COUNTRY_DATA.find(
      (c) => c.country === selectedCountryName
    );
    if (selectedCountry) {
      setAddress((prev) => ({
        ...prev,
        country: selectedCountryName,
        countryCode: selectedCountry.code,
      }));
      setMapCenter({ lat: selectedCountry.lat, lng: selectedCountry.lng });
      setMarkerPosition(null);
      if (mapRef.current) mapRef.current.setZoom(5);
    } else {
      setAddress((prev) => ({ ...prev, country: selectedCountryName }));
    }
  }, []);
  const handleCountryCodeChange = useCallback((newCode) => {
    const selectedCountry = COUNTRY_DATA.find((c) => c.code === newCode);
    if (selectedCountry) {
      setAddress((prev) => ({
        ...prev,
        countryCode: newCode,
        country: selectedCountry.country,
      }));
      if (mapRef.current) {
        mapRef.current.panTo({
          lat: selectedCountry.lat,
          lng: selectedCountry.lng,
        });
        mapRef.current.setZoom(8);
      }
    } else {
      setAddress((prev) => ({ ...prev, countryCode: newCode }));
    }
  }, []);
  const handleChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = (e) => {
    e.preventDefault();
    if (
      !address.addressLine1 ||
      !address.city ||
      !address.country ||
      !address.phone ||
      !address.firstName
    ) {
      alert("Please fill all required fields.");
      return;
    }
    if (!markerPosition) {
      if (!window.confirm("Address coordinates are not set. Continue?")) return;
    }
    onSave(address);
  };

  if (loadError) return <div>Error loading maps.</div>;
  if (!address) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Add New Address" : "Edit Address"}
          </DialogTitle>
          <DialogDescription>Provide the complete details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Address Label</Label>
            <Input
              id="label"
              value={address.label || ""}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Home"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country/Region</Label>
            <CountryCombobox
              value={address.country || ""}
              onChange={handleCountryNameSelect}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={address.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="First Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={address.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Last Name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressSearch">Address (Search & Pin)</Label>
            <AddressAutocomplete
              onSelect={handlePlaceSelect}
              setExternalValueRef={addressSearchSetValueRef}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={locateUser}
              disabled={isLocating || !isLoaded}
              className="mt-1 flex items-center justify-center w-full"
            >
              {isLocating ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <LocateFixed className="h-4 w-4 mr-2" />
              )}
              {isLocating ? "Locating..." : "Locate Me"}
            </Button>
            <div className="h-[250px] w-full rounded-md overflow-hidden border relative mt-2">
              {isLoaded ? (
                <GoogleMap
                  zoom={markerPosition ? 15 : address.country ? 8 : 5}
                  center={mapCenter}
                  mapContainerClassName="w-full h-full"
                  onClick={handleMapClick}
                  onLoad={onMapLoad}
                >
                  {markerPosition && (
                    <Marker
                      position={markerPosition}
                      draggable={true}
                      onDragEnd={handleMarkerDragEnd}
                    />
                  )}
                  {isLocating && (
                    <Loader2 className="animate-spin h-8 w-8 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-10" />
                  )}
                </GoogleMap>
              ) : (
                <div className="p-4 text-center flex justify-center items-center h-full">
                  {isLocating ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Apartment, suite, etc.</Label>
            <Input
              id="addressLine2"
              value={address.addressLine2 || ""}
              onChange={(e) => handleChange("addressLine2", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={address.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={address.state || ""}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">PIN</Label>
              <Input
                id="pincode"
                value={address.pincode || ""}
                onChange={(e) => handleChange("pincode", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressPhone">Mobile number</Label>
            <div className="flex space-x-2">
              <CountryCodeSelector
                value={address.countryCode || COUNTRY_DATA[0].code}
                onChange={handleCountryCodeChange}
              />
              <Input
                id="addressPhone"
                value={address.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Mobile number"
                type="tel"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />{" "}
              {isNew ? "Add Address" : "Save Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CountryCombobox({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const wrapperRef = useRef(null);
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  const filteredCountries = useMemo(() => {
    if (!inputValue) return COUNTRY_DATA;
    return COUNTRY_DATA.filter(
      (c) =>
        c.country.toLowerCase().includes(inputValue.toLowerCase()) ||
        c.code.includes(inputValue)
    );
  }, [inputValue]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsMenuOpen(true);
    onChange(e.target.value);
  };
  const handleSelect = (countryName) => {
    setInputValue(countryName);
    setIsMenuOpen(false);
    onChange(countryName);
  };
  return (
    <div className="relative z-30" ref={wrapperRef}>
      <Input
        id="country"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsMenuOpen(true)}
        placeholder="Type country name..."
        required
      />
      {isMenuOpen && (
        <Card className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-60 overflow-y-auto">
          <ul className="divide-y">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <li
                  key={c.country}
                  onClick={() => handleSelect(c.country)}
                  className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center"
                >
                  <span className="font-medium">
                    {c.flag} {c.country}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {c.code}
                  </span>
                </li>
              ))
            ) : (
              <li className="p-3 text-sm text-muted-foreground">
                No matches found.
              </li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}

function CountryCodeSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-40 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm shrink-0"
    >
      {COUNTRY_DATA.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.country} ({c.code})
        </option>
      ))}
    </select>
  );
}

function AddressAutocomplete({ onSelect, setExternalValueRef }) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "in" } },
    debounce: 300,
  });
  useEffect(() => {
    if (setExternalValueRef) {
      setExternalValueRef.current = setValue;
      return () => (setExternalValueRef.current = null);
    }
  }, [setValue, setExternalValueRef]);
  const handleSelect = async (addressDescription) => {
    setValue(addressDescription, false);
    clearSuggestions();
    try {
      const geocodeResults = await getGeocode({ address: addressDescription });
      const { lat, lng } = await getLatLng(geocodeResults[0]);
      onSelect(addressDescription, { lat, lng });
    } catch (error) {
      console.error("Error fetching coordinates: ", error);
      alert("Could not fetch coordinates.");
    }
  };
  return (
    <div className="relative z-20">
      <Input
        id="addressSearch"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Start typing..."
      />
      {status === "OK" && (
        <Card className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-60 overflow-y-auto">
          <ul className="divide-y">
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                onClick={() => handleSelect(description)}
                className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
              >
                {description}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
