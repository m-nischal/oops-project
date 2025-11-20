// src/components/LocationPicker.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, LocateFixed } from "lucide-react";

const libraries = ["places"];

function LocateButton({ onLocate, isSearching }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onLocate}
      disabled={isSearching}
      className="flex items-center gap-1.5"
    >
      {isSearching ? (
        <Loader2 className="animate-spin h-4 w-4" />
      ) : (
        <LocateFixed className="h-4 w-4" />
      )}
      {isSearching ? "Locating..." : "Use Current Location"}
    </Button>
  );
}

export default function LocationPicker({ onLocationSelect, initialLocation }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const defaultCenter = useMemo(() => ({ lat: 21.1458, lng: 79.0882 }), []);
  const [selected, setSelected] = useState(initialLocation || null);
  const [isLocating, setIsLocating] = useState(false);

  // --- Helper: Update location state & fetch address ---
  const updateLocation = useCallback(async (lat, lng) => {
    const newLoc = { lat, lng };
    setSelected(newLoc);

    try {
      // Convert coordinates back to an address (Reverse Geocoding)
      const results = await getGeocode({ location: newLoc });
      const address = results[0]?.formatted_address || "Custom Pin Location";
      const components = results[0]?.address_components || [];

      onLocationSelect({
        address,
        lat,
        lng,
        components,
      });
    } catch (error) {
      console.error("Reverse geocode failed:", error);
      onLocationSelect({ address: "Pinned Location", lat, lng });
    }
  }, [onLocationSelect]);

  // --- Map Interaction Handlers ---
  const onMapClick = useCallback((e) => {
    updateLocation(e.latLng.lat(), e.latLng.lng());
  }, [updateLocation]);

  const onMarkerDragEnd = useCallback((e) => {
    updateLocation(e.latLng.lat(), e.latLng.lng());
  }, [updateLocation]);

  // --- Geolocation Function ---
  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success
        updateLocation(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        // Error
        console.warn("Geolocation failed:", error);
        alert("Could not get precise location. Please search manually or drag the pin.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-Detect on first load (if empty)
  useEffect(() => {
    if (!isLoaded || (initialLocation && initialLocation.lat)) return;
    // locateUser(); 
  }, [isLoaded, initialLocation]);

  if (!isLoaded) return <div className="p-4 flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Loading Maps...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <PlacesAutocomplete 
          setSelected={setSelected} 
          onLocationSelect={onLocationSelect} // Pass parent handler directly 
        />
      </div>
      
      <div className="flex justify-end">
          <LocateButton onLocate={locateUser} isSearching={isLocating} />
      </div>

      <div className="h-[300px] w-full rounded-md overflow-hidden border relative">
        <GoogleMap
          zoom={selected ? 15 : 5}
          center={selected || defaultCenter}
          mapContainerClassName="w-full h-full"
          onClick={onMapClick} // Use new handler
        >
          {selected && (
            <Marker 
              position={selected} 
              draggable={true}        // <--- ENABLE DRAGGING
              onDragEnd={onMarkerDragEnd} // <--- HANDLE DROP
            />
          )}
        </GoogleMap>
        
        {!selected && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
                <span className="bg-white/80 px-3 py-1 rounded-md text-sm text-gray-600 shadow-sm">
                    Search, click map, or drag pin to set location
                </span>
             </div>
        )}
      </div>
    </div>
  );
}

function PlacesAutocomplete({ setSelected, onLocationSelect }) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      const locationData = {
        address,
        lat,
        lng,
        components: results[0].address_components 
      };
      
      setSelected({ lat, lng });
      onLocationSelect(locationData);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative z-10">
      <div className="flex items-center border rounded-md px-3 bg-white">
        <MapPin className="h-4 w-4 text-gray-500 mr-2" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          className="border-0 shadow-none focus-visible:ring-0 px-0"
          placeholder="Search for your shop address..."
        />
      </div>
      
      {status === "OK" && (
        <Card className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden">
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