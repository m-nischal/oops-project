// src/components/CheckoutAddressForm.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  Loader2, 
  MapPin, 
  Phone, 
  User, 
  LocateFixed, 
  Globe, 
  Check,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Google Maps/Places API imports (RE-ADDED)
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const libraries = ["places"];

// Reusing global country data structure for consistency
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

/**
 * CheckoutAddressForm - Displays and allows editing of customer contact and shipping info.
 */
export default function CheckoutAddressForm({ initialData, onDataChange, onContinue }) {
  
  const [data, setData] = useState(initialData || {});
  
  // Hook for Google Maps loading status
  const { isLoaded, loadError } = useLoadScript({
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      libraries: libraries,
  });

  // Ref to synchronize the Autocomplete input field with the form state
  const addressSearchSetValueRef = useRef(null); 
  
  // Update local state when prop changes
  useEffect(() => {
    setData(initialData);
    // Sync the search bar value when initialData changes (e.g., on reload/address select)
    if (isLoaded && addressSearchSetValueRef.current) {
        addressSearchSetValueRef.current(initialData.addressLine1 || '', false);
    }
  }, [initialData, isLoaded]);

  const handleChange = useCallback((field, value) => {
    setData(prev => {
      const newData = { ...prev, [field]: value };
      onDataChange(newData);
      return newData;
    });
  }, [onDataChange]);
  
  const handleCountryCodeChange = useCallback((value) => {
    const selectedCountry = COUNTRY_DATA.find(c => c.code === value);
    handleChange('countryCode', value);
    if (selectedCountry) {
      handleChange('country', selectedCountry.country);
    }
  }, [handleChange]);

  const handleCountryNameChange = useCallback((value) => {
    const selectedCountry = COUNTRY_DATA.find(c => c.country === value);
    handleChange('country', value);
    if (selectedCountry) {
      handleChange('countryCode', selectedCountry.code);
    }
  }, [handleChange]);

  // --- Handle selection from Google Autocomplete ---
  const handlePlaceSelect = useCallback(async (addressDescription, latLng) => {
      try {
          const results = await getGeocode({ location: latLng });
          const components = results[0]?.address_components || [];
          const [lng, lat] = [latLng.lng, latLng.lat];

          let newAddr = {
              addressLine1: addressDescription, // Full description for line 1
              city: '',
              state: '',
              country: '',
              pincode: '',
              location: { lat, lng } 
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

          // Update all relevant fields via onDataChange
          setData(prev => {
              const newData = { 
                  ...prev, 
                  ...newAddr, 
                  countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode,
                  country: newAddr.country || prev.country,
                  // Keep addressLine2 untouched if it was already manually entered
              };
              onDataChange(newData); 
              return newData;
          });
          
      } catch (error) {
          console.error("Geocode/Mapping failed:", error);
          // Only alert, still update addressLine1
          alert("Could not map the selected address to all fields. Please fill remaining fields manually.");
      }
  }, [onDataChange]);
  // ----------------------------------------------------


  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.firstName && data.addressLine1 && data.city && data.pincode && data.phone && data.email) {
      onContinue();
    } else {
        alert("Please fill in all required contact and shipping fields (First Name, Address, City, Pincode, Phone, Email).");
    }
  };

  const isFormValid = useMemo(() => {
    return data.firstName && data.addressLine1 && data.city && data.pincode && data.phone && data.email;
  }, [data]);


  // --- Country Code Selector Component ---
  const CountryCodeSelector = ({ value, onChange }) => (
    <select
      value={value || '+91'}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-11 w-32 rounded-xl border border-gray-200 bg-white px-3 text-sm shadow-sm shrink-0"
    >
      {COUNTRY_DATA.map(c => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.code}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      
      {/* 1. CONTACT INFO */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider mb-2">Contact Info</h2>
        
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</Label>
          <div className="relative">
             <Input 
                id="email" 
                type="email" 
                value={data.email || ''} 
                onChange={(e) => handleChange('email', e.target.value)} 
                placeholder="name@example.com"
                required
                className="w-full h-11 pl-4 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
             />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone</Label>
          <div className="flex gap-2">
            <CountryCodeSelector value={data.countryCode} onChange={handleCountryCodeChange} />
            <Input
              id="phone"
              type="tel"
              value={data.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Mobile number"
              required
              className="w-full h-11 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
            />
          </div>
        </div>
      </div>
      
      <Separator />

      {/* 2. SHIPPING ADDRESS (Restructured) */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider mb-2">Shipping Address</h2>
        
        {/* LINE 1: Recipient First Name / Last Name (Two Column) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Recipient First Name</Label>
            <Input
              id="firstName"
              value={data.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="First Name"
              required
              className="w-full h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Last Name (Optional)</Label>
            <Input
              id="lastName"
              value={data.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Last Name"
              className="w-full h-11 rounded-xl"
            />
          </div>
        </div>
        
        {/* LINE 2: Country */}
        <div className="space-y-2">
           <Label htmlFor="country" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Country</Label>
           <div className="relative">
                <select
                    id="country"
                    value={data.country || 'India'}
                    onChange={(e) => handleCountryNameChange(e.target.value)}
                    required
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-base shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black appearance-none"
                >
                    {COUNTRY_DATA.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country}</option>)}
                </select>
                <Globe className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
           </div>
        </div>

        {/* LINE 3: Address Search / Address Line 1 (MANDATORY) */}
        <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Address Line 1 (Street, Locality) [MANDATORY]</Label>
            {isLoaded ? (
                // Use the dedicated Autocomplete component
                <AddressAutocomplete
                    onSelect={handlePlaceSelect}
                    setExternalValueRef={addressSearchSetValueRef}
                    initialAddressLine1={data.addressLine1}
                />
            ) : loadError ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertDescription>Maps failed to load. Address Line 1 must be entered manually.</AlertDescription>
                </Alert>
            ) : (
                 <div className="h-11 flex items-center text-sm text-gray-500">
                     <Loader2 className="animate-spin h-4 w-4 mr-2"/> Loading Maps...
                 </div>
            )}
        </div>

        {/* LINE 4: Address Line 2 (Optional) */}
        <div className="space-y-2">
            <Label htmlFor="addressLine2" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Address Line 2 (Apt, Suite, Building) [Optional]</Label>
            <Input
                id="addressLine2"
                value={data.addressLine2 || ''}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                placeholder="Apartment, Suite, etc. (Optional)"
                className="w-full h-11 rounded-xl"
            />
        </div>
        
        {/* LINE 5: State / City / Postal Code (Three Column) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">State</Label>
            <Input
              id="state"
              value={data.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="State / Region"
              className="w-full h-11 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">City</Label>
            <Input
              id="city"
              value={data.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              required
              className="w-full h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Postal Code</Label>
            <Input
              id="pincode"
              value={data.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="e.g. 600001"
              required
              className="w-full h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Continue Button */}
        <Button
            type="submit"
            disabled={!isFormValid}
            className="w-full h-11 rounded-xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
        >
            Shipping
            <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}

// --- Helper Component for Google Places Autocomplete ---
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

  // Expose setValue to parent via ref so manual updates can sync the input
  useEffect(() => {
    if (setExternalValueRef) {
      setExternalValueRef.current = setValue;
      return () => { setExternalValueRef.current = null; };
    }
  }, [setValue, setExternalValueRef]);

  // Set initial value when prop changes
  useEffect(() => {
      // Only set if the initial prop is non-empty and different from current value
      if (initialAddressLine1 && initialAddressLine1 !== value) {
          setValue(initialAddressLine1, false); 
      }
  }, [initialAddressLine1, setValue]);

  const handleSelect = async (addressDescription) => {
    // 1. Update input text immediately, but don't trigger a new autocomplete query
    setValue(addressDescription, false);
    clearSuggestions();

    try {
      // 2. Fetch lat/lng (Geocode)
      const geocodeResults = await getGeocode({ address: addressDescription });
      const { lat, lng } = await getLatLng(geocodeResults[0]);
      
      // 3. Pass coords back to parent for full form update
      onSelect(addressDescription, { lat, lng });

    } catch (error) {
      console.error("Error fetching coordinates: ", error);
      alert("Could not fetch coordinates for the selected address. Please try refining your search.");
    }
  };

  return (
    <div className="relative z-20">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          id="addressSearch"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for street or house number..."
          disabled={!ready}
          className="w-full h-11 pl-12 pr-4 rounded-xl"
        />
      </div>

      {status === "OK" && (
        <Card className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-40 overflow-y-auto">
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