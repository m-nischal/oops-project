// src/components/CustomerAddressModal.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MapPin, Check, Plus, Loader2, Save, LocateFixed, ArrowLeft, Info, RefreshCw, Search, Edit } from "lucide-react";
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
  const [mode, setMode] = useState("select"); // 'select', 'add', 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null); // Holds address object for editing

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  
  // Resync selectedId when addresses update or modal opens
  useEffect(() => {
    // Attempt to select the currently active address if available in localStorage
    const savedLoc = localStorage.getItem("livemart_active_location");
    let currentId = null;
    if (savedLoc) {
        try {
            const parsed = JSON.parse(savedLoc);
            currentId = addresses.find(addr => 
                addr.location?.coordinates?.[1] === parsed.lat &&
                addr.location?.coordinates?.[0] === parsed.lng
            )?._id;
        } catch (e) { /* ignore */ }
    }
    
    // Fallback to the first address if nothing is active
    if (!currentId && addresses.length > 0) {
        currentId = addresses[0]._id;
    }

    setSelectedId(currentId);
    // Reset mode to select when modal opens
    if (isOpen) setMode("select");

  }, [addresses, isOpen]);

  // Handler for temporary location set (from 'check' mode - UNCHANGED)
  const handleApplyCheckedAddress = (locationData) => {
    // ... [existing logic to save location data to local storage and reload]
    const locDataForStorage = {
      lat: locationData.lat, 
      lng: locationData.lng, 
      city: locationData.city, 
      pincode: locationData.pincode,
      addressLine1: locationData.address 
    };
    localStorage.setItem("livemart_active_location", JSON.stringify(locDataForStorage));
    localStorage.removeItem("livemart_active_address_full"); // Clear full address when using temporary location
    
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("livemart-location-update"));
        window.location.reload(); 
    }
    onClose();
  };

  // Handle selecting an existing address
  const handleConfirmSelection = () => {
    if (selectedId) {
      const addr = addresses.find((a) => a._id === selectedId);
      onSelect(addr); // This calls setActiveLocation in parent/navbar, which reloads
    }
  };
  
  // Helper to find index of an address
  const findAddressIndex = (id) => addresses.findIndex(a => a._id === id);

  // Handle saving an edited address
  const handleSaveAddress = async (updatedAddress, isNew) => {
    try {
      const token = localStorage.getItem("token");
      
      // 1. Get current profile
      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user: currentProfile } = await profileRes.json();

      let newAddresses = [...(currentProfile.addresses || [])];
      
      if (isNew) {
        // Add mode
        newAddresses.push(updatedAddress);
      } else {
        // Edit mode: Find the index and replace the address
        const index = findAddressIndex(updatedAddress._id);
        if (index > -1) {
            newAddresses[index] = updatedAddress;
        } else {
            throw new Error("Address to edit not found.");
        }
      }

      // 2. Save back to server
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: newAddresses }),
      });

      if (res.ok) {
        const { user: updatedUser } = await res.json();
        onAddressAdded(updatedUser);
        
        // Auto-select the newly added/edited address
        const addrToSelect = isNew ? updatedUser.addresses[updatedUser.addresses.length - 1] : updatedAddress;
        if (addrToSelect) {
            onSelect(addrToSelect); // This calls setActiveLocation in parent/navbar, which reloads
        }
        setMode("select");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save address.");
      }
    } catch (err) {
      console.error("Failed to save address", err);
      alert("Failed to save address: " + err.message);
    }
  };
  
  // Handler for clicking the Edit button
  const handleEditClick = (address) => {
      setEditingAddress(address);
      setMode("edit");
  };
  
  // Handler for adding new address
  const handleAddClick = () => {
      // Clear editing address and set mode to add
      setEditingAddress(null);
      setMode("add");
  }


  const renderAddressList = () => (
    <div className="grid gap-3 py-2 max-h-[250px] overflow-y-auto">
      {addresses.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          No addresses found. Please add one.
        </div>
      )}
      {addresses.map((addr) => (
        <Card
          key={addr._id}
          className={`p-4 cursor-pointer border-2 transition-all flex items-center justify-between gap-3 ${
            selectedId === addr._id
              ? "border-black bg-gray-50"
              : "border-transparent bg-gray-50 hover:bg-gray-100"
          }`}
        >
          {/* Left Side: Info & Selector */}
          <div 
            className="flex items-start gap-3 flex-1"
            onClick={() => setSelectedId(addr._id)}
          >
            <MapPin
              className={`mt-1 h-5 w-5 shrink-0 ${
                selectedId === addr._id ? "text-black" : "text-gray-400"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm flex items-center">
                {addr.label || "Address"}
                {selectedId === addr._id && <Check className="h-4 w-4 text-black ml-2" />}
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {addr.addressLine1}, {addr.city} - {addr.pincode}
              </p>
            </div>
          </div>
          
          {/* Right Side: Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleEditClick(addr)}
                className="text-gray-700 hover:text-blue-600"
            >
                <Edit className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
  
  const renderAddressControls = () => (
    <div className="flex flex-col gap-3 mt-2">
      <Button
        variant="outline"
        onClick={handleAddClick}
        className="w-full py-6 border-dashed border-2"
      >
        <Plus className="mr-2 h-4 w-4" /> Add New Address
      </Button>
      
      <Button
        variant="secondary"
        onClick={() => setMode("check")}
        className="w-full py-6 border-2 border-dashed text-black hover:bg-gray-200"
      >
        <Search className="mr-2 h-4 w-4" /> Check Another Location
      </Button>

      <Button
        onClick={handleConfirmSelection}
        disabled={!selectedId}
        className="w-full rounded-full py-6 text-lg bg-black text-white hover:bg-black/80"
      >
        Confirm Delivery Address
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === "select" ? "Select Your Location" : 
             mode === "add" ? "Add New Address" :
             mode === "edit" ? "Edit Address" : "Check Another Location"
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "select" 
              ? "Choose or edit an address to set your delivery location." 
              : mode === "add" || mode === "edit" ? "Provide complete address details." :
              "Search or pin a temporary location."
            }
          </DialogDescription>
        </DialogHeader>

        {mode === "select" && (
          <>
            {renderAddressList()}
            {renderAddressControls()}
          </>
        )}
        
        {/* ADD/EDIT MODE */}
        {(mode === "add" || mode === "edit") && (
          <div className="space-y-4">
            {loadError && <div>Error loading maps.</div>}
            {isLoaded ? (
              <AddressForm 
                onSave={handleSaveAddress} 
                onCancel={() => setMode("select")} 
                isNew={mode === "add"}
                initialAddress={editingAddress || {}}
              />
            ) : (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* CHECK MODE */}
        {mode === "check" && (
          <div className="space-y-4">
            {loadError && <div>Error loading maps.</div>}
            {isLoaded ? (
              <CheckAddressForm 
                onApply={handleApplyCheckedAddress} 
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

// -----------------------------------------------------------
// SUB-COMPONENT: CheckAddressForm (Sets temporary location) ---
// (Remains unchanged from previous step's CheckoutAddressForm helper)
// -----------------------------------------------------------

function CheckAddressForm({ onApply, onCancel }) {
  const defaultCenter = useMemo(() => ({ lat: 20.5937, lng: 78.9629 }), []); 

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Drag pin or search to set location");
  const mapRef = useRef(null);
  const addressSearchSetValueRef = useRef(null);

  useEffect(() => {
    const savedLoc = localStorage.getItem("livemart_active_location");
    if (savedLoc) {
      try {
        const { lat, lng, city, pincode } = JSON.parse(savedLoc);
        const initialPos = { lat: Number(lat), lng: Number(lng) };
        setMapCenter(initialPos);
        setMarkerPosition(initialPos);
        setAddressLabel(`${city} ${pincode}`);
      } catch (e) {
        setMapCenter(defaultCenter);
        setMarkerPosition(defaultCenter);
      }
    }
  }, [defaultCenter]);


  const updateLocationAndAddress = useCallback(async (lat, lng) => {
    const latLng = { lat, lng };
    setMarkerPosition(latLng);
    setMapCenter(latLng);

    try {
      const results = await getGeocode({ location: latLng });
      const addressDescription = results[0]?.formatted_address || "Pinned Location";
      const components = results[0]?.address_components || [];
      
      let city = 'Pinned Location';
      let pincode = '';
      for (const component of components) {
        if (component.types.includes('locality')) city = component.long_name;
        if (component.types.includes('postal_code')) pincode = component.long_name;
      }
      
      setAddressLabel(`${city} ${pincode}`);
      
      if (addressSearchSetValueRef.current) {
        addressSearchSetValueRef.current(addressDescription, false);
      }
      
      return { address: addressDescription, lat, lng, city, pincode };
      
    } catch (error) {
      console.error("Reverse Geocode failed:", error);
      setAddressLabel("Coordinates set (could not resolve address)");
      return { address: "Pinned Location", lat, lng, city: "Custom", pincode: "" };
    }
  }, []);
  
  const handleMapClick = useCallback((e) => {
    updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationAndAddress]);

  const handleMarkerDragEnd = useCallback((e) => {
    updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationAndAddress]);

  const handlePlaceSelect = useCallback(async (addressDescription, { lat, lng }) => {
    const latLng = { lat, lng };
    await updateLocationAndAddress(lat, lng); 
    if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
    }
  }, [updateLocationAndAddress]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocationAndAddress(latitude, longitude).then((locData) => {
          setMarkerPosition({ lat: locData.lat, lng: locData.lng });
          setMapCenter({ lat: locData.lat, lng: locData.lng });
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn("Geolocation failed:", error);
        setIsLocating(false);
        alert("Could not get current location. Please search manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [updateLocationAndAddress]);

  const handleApplyLocation = async () => {
    if (!markerPosition) {
      alert("Please set a location by searching or clicking the map.");
      return;
    }
    
    const finalLocationData = await updateLocationAndAddress(markerPosition.lat, markerPosition.lng);
    onApply(finalLocationData);
  };

  return (
    <div className="grid gap-4 py-2">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="p-0 h-auto hover:bg-transparent justify-start">
        <ArrowLeft className="h-4 w-4 mr-2"/> Back to Addresses
      </Button>

      <div className="relative">
        <AddressAutocomplete 
            onSelect={handlePlaceSelect}
            setExternalValueRef={addressSearchSetValueRef}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={locateUser}
        disabled={isLocating}
        className="flex items-center justify-center w-full"
      >
        {isLocating ? (
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
        ) : (
          <LocateFixed className="h-4 w-4 mr-2" />
        )}
        {isLocating ? "Locating you..." : "Use Current Browser Location"}
      </Button>

      <div className="h-[250px] w-full rounded-md overflow-hidden border relative">
        <GoogleMap
          zoom={markerPosition ? 15 : 5}
          center={mapCenter}
          mapContainerClassName="w-full h-full"
          onClick={handleMapClick}
          onLoad={(map) => (mapRef.current = map)}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>
      
      <div className="flex items-center text-sm font-medium">
         <MapPin className="h-4 w-4 mr-2 text-primary" />
         Location Set: <span className="ml-1 text-black truncate">{addressLabel}</span>
      </div>

      <DialogFooter className="mt-4 flex-col gap-2 pt-4">
        <Button 
          onClick={handleApplyLocation} 
          disabled={!markerPosition || isLocating}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" /> Apply & Search
        </Button>
      </DialogFooter>
    </div>
  );
}


// -----------------------------------------------------------
// SUB-COMPONENT: AddressForm (Handles Add and Edit) ---
// -----------------------------------------------------------
function AddressForm({ onSave, onCancel, isNew, initialAddress }) {
  const defaultCenter = useMemo(() => initialAddress.location?.coordinates?.[1] && initialAddress.location?.coordinates?.[0] ? 
      ({ lat: initialAddress.location.coordinates[1], lng: initialAddress.location.coordinates[0] }) : 
      ({ lat: 20.5937, lng: 78.9629 }), [initialAddress]); // Default to India Center

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
    location: { type: 'Point', coordinates: [0, 0] },
    // Preserve ID if editing
    ...(initialAddress._id ? { _id: initialAddress._id } : {}), 
  });
  
  const { isLoaded, loadError } = useLoadScript({
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      libraries: libraries,
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [pinAddressText, setPinAddressText] = useState("");
  
  const mapRef = useRef(null);
  const addressSearchSetValueRef = useRef(null);

  useEffect(() => {
    if (initialAddress._id) {
        setAddress(initialAddress);
        const [lng, lat] = initialAddress.location?.coordinates || [0, 0];
        if (lng !== 0 || lat !== 0) {
            setMarkerPosition({ lat, lng });
            setMapCenter({ lat, lng });
        }
        setPinAddressText(initialAddress.addressLine1 || "");
    }
  }, [initialAddress]);


  const updateLocationAndAddress = useCallback(async (lat, lng, pan = true) => {
    const latLng = { lat, lng };
    setMarkerPosition(latLng);
    setMapCenter(latLng);

    try {
      const results = await getGeocode({ location: latLng });
      const components = results[0]?.address_components || [];
      const addressDescription = results[0]?.formatted_address || "Pinned Location";

      setPinAddressText(`Current Pin: ${addressDescription}`);

      if (addressSearchSetValueRef.current) {
        addressSearchSetValueRef.current(addressDescription, false);
      }

      let newAddr = {
        addressLine1: addressDescription,
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
    // Pass object and whether it is new to parent handler
    onSave(address, isNew);
  };

  const handleChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };
  
  const handleMapClick = useCallback((e) => {
    updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationAndAddress]);

  const handleMarkerDragEnd = useCallback((e) => {
    updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
  }, [updateLocationAndAddress]);
  
  const handlePlaceSelect = useCallback((addressDescription, latLng) => {
    updateLocationAndAddress(latLng.lat, latLng.lng);
  }, [updateLocationAndAddress]);


  if (loadError) return <Alert variant="destructive"><AlertDescription>Error loading Google Maps. Please refresh.</AlertDescription></Alert>;

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-4 py-2">
        <div className="flex justify-between items-center">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="p-0 h-auto hover:bg-transparent justify-start">
              <ArrowLeft className="h-4 w-4 mr-2"/> Back to Selection
          </Button>
        </div>
        
        {/* Row 1: Label */}
        <div className="space-y-2">
          <Label>Address Label</Label>
          <Input value={address.label} onChange={(e) => handleChange('label', e.target.value)} placeholder="e.g., Home, Work" className="h-11" />
        </div>

        {/* Row 2: Names */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={address.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={address.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="h-11" />
          </div>
        </div>

        {/* Row 3: Address Search / Address Line 1 */}
        <div className="space-y-2">
            <Label>Address Line 1 (Search & Pin)</Label>
            {isLoaded ? (
                <AddressAutocomplete 
                  onSelect={handlePlaceSelect}
                  setExternalValueRef={addressSearchSetValueRef}
                  initialAddressLine1={address.addressLine1}
                />
            ) : (
                <div className="h-11 flex items-center text-sm text-gray-500"><Loader2 className="animate-spin h-4 w-4 mr-2"/> Loading Search...</div>
            )}
        </div>
        
        {/* Row 4: Map & Locate Button */}
        <div className="space-y-2">
            <Button type="button" variant="outline" size="sm" onClick={locateUser} disabled={isLocating || !isLoaded} className="w-full">
              {isLocating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <LocateFixed className="h-4 w-4 mr-2" />}
              Use Current Location
            </Button>
            
            <div className="h-[200px] w-full rounded-md overflow-hidden border">
                {isLoaded ? (
                    <GoogleMap
                      zoom={markerPosition ? 15 : 5}
                      center={mapCenter}
                      mapContainerClassName="w-full h-full"
                      onClick={handleMapClick}
                      onLoad={(map) => (mapRef.current = map)}
                    >
                      {markerPosition && <Marker position={markerPosition} draggable onDragEnd={handleMarkerDragEnd} />}
                    </GoogleMap>
                ) : (
                    <div className="h-full grid place-items-center text-muted-foreground">Map Loading...</div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">{pinAddressText}</p>
        </div>


        {/* Row 5: Address Line 2 */}
        <div className="space-y-2">
          <Label>Address Line 2 (Apt, Suite, Building)</Label>
          <Input value={address.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} placeholder="Apartment, suite, unit, building (Optional)" className="h-11" />
        </div>

        {/* Row 6: City/State/Pincode/CountryCode */}
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>City</Label>
                <Input value={address.city} onChange={(e) => handleChange('city', e.target.value)} required className="h-11" />
            </div>
            <div className="space-y-2">
                <Label>State</Label>
                <Input value={address.state} onChange={(e) => handleChange('state', e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={address.pincode} onChange={(e) => handleChange('pincode', e.target.value)} className="h-11" />
            </div>
        </div>

        {/* Row 7: Mobile Number */}
        <div className="space-y-2">
          <Label>Mobile Number</Label>
          <div className="flex gap-2">
            <select 
              className="border rounded-xl px-2 text-sm bg-background h-11"
              value={address.countryCode}
              onChange={(e) => handleChange('countryCode', e.target.value)}
            >
              {COUNTRY_DATA.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <Input value={address.phone} onChange={(e) => handleChange('phone', e.target.value)} required type="tel" className="h-11" />
          </div>
        </div>

        <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> {isNew ? "Save Address" : "Save Changes"}
            </Button>
        </DialogFooter>
      </form>
    </>
  );
}


// --- Helper: Address Autocomplete ---
function AddressAutocomplete({ onSelect, setExternalValueRef, initialAddressLine1 }) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: ["in", "pk", "bd", "np", "bt", "lk", "mv", "af"] },
    },
    debounce: 300,
  });

  useEffect(() => {
    if (setExternalValueRef) {
      setExternalValueRef.current = setValue;
      return () => (setExternalValueRef.current = null);
    }
  }, [setValue, setExternalValueRef]);

  useEffect(() => {
      // Set initial value when prop changes
      if (initialAddressLine1 && initialAddressLine1 !== value) {
          setValue(initialAddressLine1, false); 
      }
  }, [initialAddressLine1, setValue]);


  const handleSelect = async (addressDescription) => {
    setValue(addressDescription, false);
    clearSuggestions();
    try {
      const geocodeResults = await getGeocode({ address: addressDescription });
      const { lat, lng } = await getLatLng(geocodeResults[0]);
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
        placeholder="Type to search for your address..."
        className="h-11 pl-4 pr-4"
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