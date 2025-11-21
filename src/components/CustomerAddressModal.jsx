import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MapPin, Check, Plus, Loader2, Save, LocateFixed, ArrowLeft, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const libraries = ["places"];

// --- EXTENDED COUNTRY DATA ---
const COUNTRY_DATA = [
  { country: "Afghanistan", code: "+93", flag: "🇦🇫", lat: 33.9391, lng: 67.7099, iso2: "AF" },
  { country: "Bangladesh", code: "+880", flag: "🇧🇩", lat: 23.685, lng: 90.3563, iso2: "BD" },
  { country: "Bhutan", code: "+975", flag: "🇧🇹", lat: 27.5142, lng: 90.4336, iso2: "BT" },
  { country: "India", code: "+91", flag: "🇮🇳", lat: 20.5937, lng: 78.9629, iso2: "IN" },
  { country: "Maldives", code: "+960", flag: "🇲🇻", lat: 3.2028, lng: 73.2207, iso2: "MV" },
  { country: "Nepal", code: "+977", flag: "🇳🇵", lat: 28.3949, lng: 84.124, iso2: "NP" },
  { country: "Pakistan", code: "+92", flag: "🇵🇰", lat: 30.3753, lng: 69.3451, iso2: "PK" },
  { country: "Sri Lanka", code: "+94", flag: "🇱🇰", lat: 7.8731, lng: 80.7718, iso2: "LK" },
].sort((a, b) => a.country.localeCompare(b.country));

export default function CustomerAddressModal({ isOpen, onClose, addresses, onSelect, onAddressAdded }) {
  const [mode, setMode] = useState("select"); // 'select' or 'add'
  const [selectedId, setSelectedId] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // Handle selecting an existing address
  const handleConfirmSelection = () => {
    if (selectedId) {
      const addr = addresses.find((a) => a._id === selectedId);
      onSelect(addr);
    }
  };

  // Handle saving a new address
  const handleSaveNewAddress = async (newAddress) => {
    try {
      const token = localStorage.getItem("token");
      
      // 1. Get current profile
      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = await profileRes.json();

      // 2. Add new address
      const updatedAddresses = [...(user.addresses || []), newAddress];

      // 3. Save back to server
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (res.ok) {
        const { user: updatedUser } = await res.json();
        // 4. Notify parent to refresh user data
        onAddressAdded(updatedUser);
        // 5. Auto-select the new address (it will be the last one)
        const newlyCreated = updatedUser.addresses[updatedUser.addresses.length - 1];
        if (newlyCreated) {
            onSelect(newlyCreated);
        }
        // 6. Reset mode
        setMode("select");
      }
    } catch (err) {
      console.error("Failed to save address", err);
      alert("Failed to save address. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === "select" ? "Select Your Location" : "Add New Address"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "select" 
              ? "Choose a delivery location to see products available in your area." 
              : "Enter your address details below."}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" ? (
          <div className="space-y-4">
            {/* LIST VIEW */}
            <div className="grid gap-3 py-2 max-h-[300px] overflow-y-auto">
              {addresses.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No addresses found. Please add one.
                </div>
              )}
              {addresses.map((addr) => (
                <Card
                  key={addr._id}
                  className={`p-4 cursor-pointer border-2 transition-all flex items-start gap-3 ${
                    selectedId === addr._id
                      ? "border-black bg-gray-50"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedId(addr._id)}
                >
                  <MapPin
                    className={`mt-1 h-5 w-5 ${
                      selectedId === addr._id ? "text-black" : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {addr.label || "Address"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {addr.addressLine1}, {addr.city} - {addr.pincode}
                    </p>
                  </div>
                  {selectedId === addr._id && (
                    <Check className="h-5 w-5 text-black" />
                  )}
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setMode("add")}
                className="w-full py-6 border-dashed border-2"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Address
              </Button>

              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedId}
                className="w-full rounded-full py-6 text-lg bg-black text-white hover:bg-black/80"
              >
                Confirm Location
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ADD ADDRESS FORM */}
            {isLoaded ? (
              <AddressForm 
                onSave={handleSaveNewAddress} 
                onCancel={() => setMode("select")} 
              />
            ) : (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- SUB-COMPONENT: Address Form (Logic from Profile Page) ---
function AddressForm({ onSave, onCancel }) {
  const defaultCenter = useMemo(() => ({ lat: 20.5937, lng: 78.9629 }), []); // India Center
  
  const [address, setAddress] = useState({
    label: "Home",
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    countryCode: "+91",
    phone: "",
    location: { type: 'Point', coordinates: [0, 0] }
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Permission Help State
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  
  const mapRef = useRef(null);
  const addressSearchSetValueRef = useRef(null);
  
  const updateLocationAndAddress = useCallback(async (lat, lng, pan = true) => {
    const latLng = { lat, lng };
    setMarkerPosition(latLng);
    setMapCenter(latLng);

    try {
      const results = await getGeocode({ location: latLng });
      const components = results[0]?.address_components || [];
      const addressDescription = results[0]?.formatted_address || "";

      if (addressSearchSetValueRef.current) {
        addressSearchSetValueRef.current(addressDescription, false);
      }

      let newAddr = {
        addressLine1: addressDescription.split(',')[0].trim(),
        city: '',
        state: '',
        country: '',
        pincode: '',
        location: { type: 'Point', coordinates: [lng, lat] }
      };

      let countryCodeFound = '';
      for (const component of components) {
        if (component.types.includes('locality')) newAddr.city = component.long_name;
        if (component.types.includes('administrative_area_level_1')) newAddr.state = component.short_name;
        if (component.types.includes('country')) {
          newAddr.country = component.long_name;
          countryCodeFound = component.short_name;
        }
        if (component.types.includes('postal_code')) newAddr.pincode = component.long_name;
      }

      const phoneCodeObj = countryCodeFound ? COUNTRY_DATA.find(c => c.iso2 === countryCodeFound) : null;

      setAddress(prev => ({
        ...prev,
        ...newAddr,
        countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode,
      }));

      if (mapRef.current && pan) {
        mapRef.current.panTo(latLng);
      }

    } catch (error) {
      console.error("Geocode failed:", error);
    }
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocationAndAddress(latitude, longitude, true);
        setIsLocating(false);
      },
      (error) => {
        console.warn("Location access denied:", error);
        setIsLocating(false);
        // Trigger Permission Help Dialog when access is denied
        setShowPermissionHelp(true);
      }
    );
  }, [updateLocationAndAddress]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.addressLine1 || !address.city || !address.firstName) {
      alert("Please fill all required fields.");
      return;
    }
    if (!markerPosition && !window.confirm("Location pin not set. Continue?")) {
      return;
    }
    onSave(address);
  };

  const handleChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-4 py-2">
        <div className="flex justify-between items-center">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="p-0 h-auto hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2"/> Back
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Address Label</Label>
          <Input value={address.label} onChange={(e) => handleChange('label', e.target.value)} placeholder="e.g., Home, Work" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={address.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={address.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Search Address</Label>
          <AddressAutocomplete 
            onSelect={(desc, { lat, lng }) => updateLocationAndAddress(lat, lng)}
            setExternalValueRef={addressSearchSetValueRef}
          />
          <Button type="button" variant="outline" size="sm" onClick={locateUser} disabled={isLocating} className="w-full mt-1">
            {isLocating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <LocateFixed className="h-4 w-4 mr-2" />}
            Use Current Location
          </Button>
          
          <div className="h-[200px] w-full rounded-md overflow-hidden border mt-2">
            <GoogleMap
              zoom={markerPosition ? 15 : 5}
              center={mapCenter}
              mapContainerClassName="w-full h-full"
              onClick={(e) => updateLocationAndAddress(e.latLng.lat(), e.latLng.lng())}
              onLoad={(map) => (mapRef.current = map)}
            >
              {markerPosition && <Marker position={markerPosition} draggable onDragEnd={(e) => updateLocationAndAddress(e.latLng.lat(), e.latLng.lng())} />}
            </GoogleMap>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Address Line 1</Label>
          <Input value={address.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={address.city} onChange={(e) => handleChange('city', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input value={address.state} onChange={(e) => handleChange('state', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input value={address.pincode} onChange={(e) => handleChange('pincode', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mobile Number</Label>
          <div className="flex gap-2">
            <select 
              className="border rounded-md px-2 text-sm bg-background"
              value={address.countryCode}
              onChange={(e) => handleChange('countryCode', e.target.value)}
            >
              {COUNTRY_DATA.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <Input value={address.phone} onChange={(e) => handleChange('phone', e.target.value)} required type="tel" />
          </div>
        </div>

        <Button type="submit" className="w-full mt-2">
          <Save className="mr-2 h-4 w-4" /> Save Address
        </Button>
      </form>

      {/* --- PERMISSION HELP DIALOG --- */}
      <Dialog open={showPermissionHelp} onOpenChange={setShowPermissionHelp}>
        <DialogContent className="sm:max-w-[450px] z-[60]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Enable Location Access
            </DialogTitle>
            <DialogDescription>
              Your browser is blocking location access. Here is how to fix it:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2 text-sm text-gray-600">
            <div className="flex gap-3 items-start">
              <div className="bg-gray-100 px-2 py-1 rounded font-mono text-xs font-bold text-black">1</div>
              <p>Click the <strong>Lock icon</strong> or <strong>Settings icon</strong> on the left side of your address bar (URL bar).</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-gray-100 px-2 py-1 rounded font-mono text-xs font-bold text-black">2</div>
              <p>Look for <strong>Location</strong> permissions and switch it to <strong>Allow</strong> or toggle it On.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-gray-100 px-2 py-1 rounded font-mono text-xs font-bold text-black">3</div>
              <p>Close this popup and click the button below to refresh.</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => {
                setShowPermissionHelp(false);
                window.location.reload(); 
              }} 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> I've Enabled It, Refresh Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Helper: Address Autocomplete ---
function AddressAutocomplete({ onSelect, setExternalValueRef }) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

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
      const results = await getGeocode({ address: addressDescription });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(addressDescription, { lat, lng });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative z-20">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Type to search..."
      />
      {status === "OK" && (
        <Card className="absolute top-full mt-1 w-full z-50 max-h-40 overflow-y-auto">
          <ul className="divide-y">
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                onClick={() => handleSelect(description)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
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