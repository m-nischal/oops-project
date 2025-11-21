// src/components/ManualLocationModal.jsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, MapPin, LocateFixed, Save } from "lucide-react";

const libraries = ["places"];

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
      
      // Extract city/pincode for UI label and saving
      let city = 'Pinned Location';
      let pincode = '';
      const components = results[0].address_components || [];
      for (const component of components) {
        if (component.types.includes('locality')) city = component.long_name;
        if (component.types.includes('postal_code')) pincode = component.long_name;
      }
      
      onSelect({ address: addressDescription, lat, lng, city, pincode });
    } catch (error) {
      console.error("Error: ", error);
      alert("Could not fetch coordinates for the selected address.");
    }
  };

  return (
    <div className="relative z-20">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search for a city or address..."
        className="pl-8"
      />
      <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      
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
// -----------------------------------------------------------

/**
 * Modal to let a guest user manually set a location to browse products.
 */
export default function ManualLocationModal({ isOpen, onClose, onLocationSet }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  
  // Default to India Center if no previous location is found
  const defaultCenter = useMemo(() => ({ lat: 20.5937, lng: 78.9629 }), []); 

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Drag pin or search to set location");
  const mapRef = useRef(null);
  const addressSearchSetValueRef = useRef(null);

  useEffect(() => {
    if (isLoaded) {
      // Try to load initial location from localStorage if available
      const savedLoc = localStorage.getItem("livemart_active_location");
      if (savedLoc) {
        try {
          const { lat, lng, city, pincode } = JSON.parse(savedLoc);
          const initialPos = { lat: Number(lat), lng: Number(lng) };
          setMapCenter(initialPos);
          setMarkerPosition(initialPos);
          setAddressLabel(`${city} ${pincode}`);
        } catch (e) {
          // Fallback to default
          setMapCenter(defaultCenter);
          setMarkerPosition(defaultCenter);
        }
      }
    }
  }, [isLoaded, defaultCenter]);


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
      
      // Update the search bar text
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

  const handlePlaceSelect = useCallback(async ({ address, lat, lng, city, pincode }) => {
    const latLng = { lat, lng };
    setMarkerPosition(latLng);
    setMapCenter(latLng);
    if (mapRef.current) mapRef.current.panTo(latLng);
    setAddressLabel(`${city} ${pincode || ''}`);
  }, []);

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
    
    // Reverse geocode again to ensure the freshest location data is saved
    const finalLocationData = await updateLocationAndAddress(markerPosition.lat, markerPosition.lng);

    // Save to local storage
    localStorage.setItem("livemart_active_location", JSON.stringify({
      lat: finalLocationData.lat, 
      lng: finalLocationData.lng, 
      city: finalLocationData.city, 
      pincode: finalLocationData.pincode
    }));
    
    // Notify parent component and trigger reload
    onLocationSet(finalLocationData); 
    
    // --- MODIFIED: Force page reload ---
    if (typeof window !== "undefined") {
        window.location.reload(); 
    }
    // ----------------------------
    
    onClose();
  };

  if (loadError) return <div>Error loading maps.</div>;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Choose New Location
          </DialogTitle>
          <DialogDescription>
            Pin a location on the map to search for products nearby.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          
          {/* 1. Address Search */}
          <div className="relative">
            <AddressAutocomplete 
                onSelect={handlePlaceSelect}
                setExternalValueRef={addressSearchSetValueRef}
            />
          </div>

          {/* 2. Locate Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={locateUser}
            disabled={isLocating || !isLoaded}
            className="flex items-center justify-center w-full"
          >
            {isLocating ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <LocateFixed className="h-4 w-4 mr-2" />
            )}
            {isLocating ? "Locating you..." : "Use Current Browser Location"}
          </Button>

          {/* 3. Map View */}
          <div className="h-[250px] w-full rounded-md overflow-hidden border relative">
            {isLoaded ? (
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
                {isLocating && (
                  <Loader2 className="animate-spin h-8 w-8 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-10 text-white" />
                )}
              </GoogleMap>
            ) : (
              <div className="p-4 text-center flex justify-center items-center h-full text-muted-foreground">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Loading map...
              </div>
            )}
          </div>
          
          {/* 4. Display Selected Location */}
          <div className="flex items-center text-sm font-medium">
             <MapPin className="h-4 w-4 mr-2 text-primary" />
             Location Set: <span className="ml-1 text-black truncate">{addressLabel}</span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApplyLocation} 
            disabled={!markerPosition || isLocating}
          >
            <Save className="mr-2 h-4 w-4" /> Apply & Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}