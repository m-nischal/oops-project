// src/pages/retailer/products/[id]/edit.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import RetailerLayout from '../../../../components/RetailerLayout';
import TagsInput from '../../../../components/TagsInput';
import { useAuthGuard } from '../../../../hooks/useAuthGuard';
// import LocationPicker from '../../../../components/LocationPicker'; // no longer used
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Trash2, Upload, X, Lock, MapPin, User, LocateFixed, Globe as GlobeIcon, Phone as PhoneIcon, Check } from "lucide-react";

// MAP/PLACES IMPORTS
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

const libraries = ["places"];

// --- COUNTRY DATA: LIMITED TO INDIAN SUBCONTINENT ---
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

// --- Helper to decode user info from token ---
function getUserInfoFromToken() {
  if (typeof window === "undefined")
    return { id: null, email: null, name: null, phone: null, isLoggedIn: false };
  const token = localStorage.getItem("token");
  if (!token) return { id: null, email: null, name: null, phone: null, isLoggedIn: false };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      isLoggedIn: true,
    };
  } catch (e) {
    return { id: null, email: null, name: null, phone: null, isLoggedIn: false };
  }
}

// Helper to check if locationData has coordinates (needed for saving)
const isLocationSet = (loc) => loc && loc.location?.coordinates?.[0] !== 0;

export default function EditProductPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  const { id: productId } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Modal/User Context State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(getUserInfoFromToken());

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [tags, setTags] = useState([]);

  // Address/Location State
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [locationData, setLocationData] = useState(null);

  // Other States
  const [sizes, setSizes] = useState([]);
  const [originalSizes, setOriginalSizes] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [sizeChartFile, setSizeChartFile] = useState(null);
  const [sizeChartPreview, setSizeChartPreview] = useState(null);
  const [existingSizeChart, setExistingSizeChart] = useState(null);
  const [sizeChartName, setSizeChartName] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Helper to map user address fields to product warehouse fields
  const mapAddressToWarehouse = useCallback((address) => {
    if (!address || !address.location || !address.location.coordinates) return null;
    return {
      address: `${address.label}: ${address.addressLine1} ${address.addressLine2 || ''}`,
      location: {
        type: 'Point',
        coordinates: address.location.coordinates
      },
      city: address.city,
      state: address.state,
      country: address.country
    };
  }, []);

  // Helper to find matching saved address ID
  const findMatchingAddressId = useCallback((productWarehouse, addresses) => {
    if (!productWarehouse || !addresses || addresses.length === 0) return null;

    const [lng, lat] = productWarehouse.location?.coordinates || [0, 0];
    if (lng === 0 && lat === 0) return null;

    const match = addresses.find(addr => {
      const [addrLng, addrLat] = addr.location?.coordinates || [null, null];
      return addrLng != null && addrLat != null &&
        Math.round(addrLat * 1000) === Math.round(lat * 1000) &&
        Math.round(addrLng * 1000) === Math.round(lng * 1000);
    });

    return match ? match._id.toString() : null;
  }, []);

  // Save new address to profile (from modal)
  const handleSaveNewAddressToProfile = useCallback(
    async (newAddress) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const profileRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { user } = await profileRes.json();

        const updatedAddresses = [...(user.addresses || []), newAddress];

        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ addresses: updatedAddresses }),
        });

        if (!res.ok) throw new Error("Failed to save new address to profile.");
        const { user: updatedUser } = await res.json();

        setUserAddresses(updatedUser.addresses);

        const newAddressId =
          updatedUser.addresses[updatedUser.addresses.length - 1]._id.toString();

        setSelectedAddressId(newAddressId);
        setLocationData(
          mapAddressToWarehouse(
            updatedUser.addresses.find((a) => a._id.toString() === newAddressId)
          )
        );
        setIsAddressModalOpen(false);
      } catch (err) {
        console.error("Failed to save address:", err);
        setError(`Error saving address: ${err.message}`);
      }
    },
    [mapAddressToWarehouse]
  );

  // Fetch All Data (Product + Addresses)
  useEffect(() => {
    if (!productId || isAuthLoading) return;

    const fetchAllData = async () => {
      setIsFetching(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found. Please log in.");
        setIsFetching(false);
        return;
      }
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      try {
        // 1. Fetch Product Data
        const productRes = await fetch(`/api/retailer/products/${productId}`, { headers: authHeaders });
        if (!productRes.ok) {
          const errData = await productRes.json();
          throw new Error(errData.error || "Failed to fetch product data.");
        }
        const { product } = await productRes.json();

        // 2. Fetch User Addresses
        const addressesRes = await fetch('/api/user/profile', { headers: authHeaders });
        if (!addressesRes.ok) throw new Error('Failed to fetch user addresses.');
        const { user } = await addressesRes.json();
        const addresses = user.addresses || [];
        setUserAddresses(addresses);
        setUserDetails(user);
        setAddressesLoading(false);

        // Populate standard fields
        setName(product.name || '');
        setDescription(product.description || '');
        setPrice(product.price?.toString() || '');
        setBrand(product.brand || '');
        setTags(product.tags || []);

        // Sizes
        const loadedSizes = product.sizes || [{ size: 'S', sku: '', stock: 0 }];
        setSizes(loadedSizes);
        setOriginalSizes(JSON.parse(JSON.stringify(loadedSizes)));

        setExistingImages(product.images || []);
        setSizeChartName(product.sizeChart?.chartName || '');
        setExistingSizeChart(product.sizeChart?.image || null);
        setIsPublished(product.isPublished || false);

        // 3. Match and Set Location State
        const productWarehouse = product.warehouses?.[0];

        if (productWarehouse?.location?.coordinates) {
          setLocationData(mapAddressToWarehouse(productWarehouse));
          const matchId = findMatchingAddressId(productWarehouse, addresses);
          if (matchId) {
            setSelectedAddressId(matchId);
          } else {
            setSelectedAddressId('choose');
          }
        } else if (addresses.length > 0) {
          setSelectedAddressId(addresses[0]._id.toString());
          setLocationData(mapAddressToWarehouse(addresses[0]));
        } else {
          setSelectedAddressId('choose');
          setLocationData(null);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        setAddressesLoading(false);
      } finally {
        setIsFetching(false);
      }
    };

    fetchAllData();
  }, [productId, isAuthLoading, findMatchingAddressId, mapAddressToWarehouse]);

  // Address Selection Handler (For Modal)
  const handleAddressSelectionFromModal = (addressId) => {
    setSelectedAddressId(addressId);
    setError(null);

    const selected = userAddresses.find(addr => addr._id.toString() === addressId);
    if (selected) {
      setLocationData(mapAddressToWarehouse(selected));
    } else {
      setLocationData(null);
    }
    setIsAddressModalOpen(false);
  };

  // Stock Constraint Logic
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];

    if (field === 'stock') {
      const newStock = Number(value);
      const maxStock = originalSizes[index]?.stock || 0;

      if (newStock > maxStock) {
        alert(`You cannot increase stock manually. Max available from inventory is ${maxStock}. Order more from the Wholesaler to increase this.`);
        return;
      }
      newSizes[index][field] = newStock;
    } else {
      newSizes[index][field] = value;
    }
    setSizes(newSizes);
  };

  const removeSize = (index) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
    setOriginalSizes(prev => prev.filter((_, i) => i !== index));
  };

  // Upload/Image Helpers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles(prevFiles => [...prevFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSizeChartChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSizeChartFile(file);
      setSizeChartPreview(URL.createObjectURL(file));
      setExistingSizeChart(null);
    }
  };

  const uploadFiles = async (fieldName, files) => {
    const formData = new FormData();
    files.forEach(file => { formData.append(fieldName, file); });
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!uploadRes.ok) throw new Error('File upload failed');
    return await uploadRes.json();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!locationData || !isLocationSet(locationData)) {
      setError("Please select a saved address to use as the store location.");
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setError(null);

    let newImageUrls = [];
    let newSizeChartUrl = '';

    try {
      // Upload new product images (if any)
      if (imageFiles.length > 0) {
        const uploadData = await uploadFiles('productImages', imageFiles);
        newImageUrls = uploadData.urls?.productImages || [];
      }

      // Upload size chart (if changed)
      if (sizeChartFile) {
        const uploadData = await uploadFiles('productImage', [sizeChartFile]);
        newSizeChartUrl = uploadData.urls?.productImage?.[0] || '';
      }

      setIsUploading(false);

      // Build Final Payload
      const productData = {
        name,
        description,
        price: Number(price),
        brand,
        images: [...existingImages, ...newImageUrls],
        sizes,
        tags,
        sizeChart: {
          chartName: sizeChartName,
          image: newSizeChartUrl ? newSizeChartUrl : existingSizeChart
        },
        warehouses: [locationData],
        isPublished
      };

      // PUT Request
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`/api/retailer/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update product');
      }

      if (isPublished) router.push('/retailer/products');
      else router.push('/retailer/inventory');

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const currentAddress = locationData;

  if (isAuthLoading || isFetching) {
    return (
      <RetailerLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </RetailerLayout>
    );
  }

  return (
    <RetailerLayout>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/retailer/inventory')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              {(loading || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading ? "Saving..." : (isUploading ? "Uploading..." : "Save Changes")}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand Name</Label>
                    <Input
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categories / Tags</Label>
                  <TagsInput tags={tags} setTags={setTags} />
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle>Store Location</CardTitle>
                <CardDescription>
                  Select a previously saved address for your store location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addressesLoading ? (
                  <div className="flex items-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading addresses...
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address-select">Choose Store Address</Label>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between h-12 text-left"
                        onClick={() => setIsAddressModalOpen(true)}
                        disabled={addressesLoading}
                      >
                        {currentAddress && isLocationSet(currentAddress) ? (
                          <span className="truncate">
                            <span className="font-bold mr-2 text-primary">
                              {currentAddress.address.split(":")[0]}
                            </span>
                            {currentAddress.city}, {currentAddress.country}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Click to select or add location...
                          </span>
                        )}
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>

                    {currentAddress && isLocationSet(currentAddress) && (
                      <Alert className="mt-4 text-xs">
                        <MapPin className="h-4 w-4" />
                        <AlertTitle>Address Selected</AlertTitle>
                        <AlertDescription>
                          {currentAddress.address} <br />
                          {currentAddress.city}, {currentAddress.state},{" "}
                          {currentAddress.country}
                          <div className="mt-1 font-medium">
                            Coordinates Set.
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {!currentAddress && userAddresses.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTitle>No Location Selected</AlertTitle>
                        <AlertDescription>
                          Please click the button above to select one of your saved addresses as the store location.
                        </AlertDescription>
                      </Alert>
                    )}

                    {userAddresses.length === 0 && (
                      <Alert variant="secondary">
                        <AlertTitle>Address Management</AlertTitle>
                        <AlertDescription>
                          You have no saved addresses. Please use the button above to add your first one.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stock & Sizes */}
            <Card>
              <CardHeader>
                <CardTitle>Size Variants & Stock</CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center mt-1">
                  <Lock className="h-3 w-3 mr-1" /> Stock levels cannot be increased. Order from Wholesaler to increase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sizes.map((size, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-2">
                      <Label>Size</Label>
                      <Input value={size.size} disabled className="bg-gray-100" />
                    </div>
                    <div className="col-span-5 space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={size.sku}
                        onChange={(e) => handleSizeChange(index, 'sku', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Stock (Max: {originalSizes[index]?.stock})</Label>
                      <Input
                        type="number"
                        value={size.stock}
                        onChange={(e) => handleSizeChange(index, 'stock', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => removeSize(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="isPublished"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="isPublished">Publish to Shop</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPublished ? "Product is live." : "Product is in inventory (draft)."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="text-sm text-gray-500">Click to upload</p>
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg"
                    multiple
                  />
                </Label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Size Chart</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sizeChartName">Size Chart Name (Optional)</Label>
                  <Input
                    id="sizeChartName"
                    value={sizeChartName}
                    onChange={(e) => setSizeChartName(e.target.value)}
                    placeholder="e.g., Men's Hoodie Chart"
                  />
                </div>
                <Label
                  htmlFor="size-chart-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative"
                >
                  {sizeChartPreview ? (
                    <img
                      src={sizeChartPreview}
                      alt="Size chart preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : existingSizeChart ? (
                    <img
                      src={existingSizeChart}
                      alt="Existing size chart"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-500" />
                      <p className="text-sm text-gray-500">Upload Chart</p>
                    </div>
                  )}
                  <Input
                    id="size-chart-file"
                    type="file"
                    className="hidden"
                    onChange={handleSizeChartChange}
                    accept="image/png, image/jpeg"
                  />
                </Label>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Address Modal */}
      <AddressSelectionAndCreationModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={userAddresses}
        currentSelectedId={selectedAddressId}
        onAddressSelect={handleAddressSelectionFromModal}
        onSaveNewAddress={handleSaveNewAddressToProfile}
        userDetails={userDetails}
      />
    </RetailerLayout>
  );
}

// -----------------------------------------------------------
// START: SHARED UTILITY COMPONENTS
// -----------------------------------------------------------

function AddressSelectionAndCreationModal({
  isOpen,
  onClose,
  addresses,
  currentSelectedId,
  onAddressSelect,
  onSaveNewAddress,
  userDetails,
}) {
  const [mode, setMode] = useState("selection"); // 'selection' or 'creation'
  const [selectedId, setSelectedId] = useState(currentSelectedId);

  useEffect(() => {
    setSelectedId(currentSelectedId);
    if (isOpen) setMode("selection");
  }, [currentSelectedId, isOpen]);

  const handleApply = () => {
    if (selectedId) {
      onAddressSelect(selectedId);
      onClose();
    }
  };

  const handleNewAddressComplete = (newAddress) => {
    onSaveNewAddress(newAddress);
    setMode("selection");
  };

  if (mode === "creation") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-6">
          <AddressCreationForm
            onCancel={() => setMode("selection")}
            onSaveNewAddress={handleNewAddressComplete}
            userDetails={userDetails}
            initialAddress={{
              label: "New Warehouse",
              firstName: userDetails.name?.split(" ")[0] || "",
              lastName: userDetails.name?.split(" ").slice(1).join(" ") || "",
              phone: userDetails.phone || "",
              countryCode: COUNTRY_DATA.find(c => c.iso2 === "IN")?.code || COUNTRY_DATA[0].code,
              addressLine1: "",
              addressLine2: "",
              city: "",
              state: "",
              pincode: "",
              country: COUNTRY_DATA.find(c => c.iso2 === "IN")?.country || COUNTRY_DATA[0].country,
              location: { type: "Point", coordinates: [0, 0] },
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Selection mode
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose your location</DialogTitle>
          <DialogDescription>
            Select an existing address or add a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pt-2">
          {addresses.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground border rounded-md">
              No saved addresses found.
            </div>
          ) : (
            addresses.map((addr) => (
              <Card
                key={addr._id.toString()}
                onClick={() => setSelectedId(addr._id.toString())}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedId === addr._id.toString()
                    ? "border-2 border-blue-500 ring-2 ring-blue-200"
                    : "border border-gray-300 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`font-extrabold text-sm uppercase mr-2 ${
                      selectedId === addr._id.toString()
                        ? "text-blue-600"
                        : "text-gray-800"
                    }`}
                  >
                    {addr.label || "Default"}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">
                      {addr.firstName} {addr.lastName}
                    </div>
                    <div className="text-gray-600">
                      {addr.addressLine1}, {addr.city} {addr.pincode}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}

          <Button
            variant="link"
            className="p-0 text-blue-600 justify-start"
            onClick={() => setMode("creation")}
          >
            + Add a new address
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            onClick={handleApply}
            disabled={!selectedId || addresses.length === 0}
            className="w-full"
          >
            Apply Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddressCreationForm({
  onCancel,
  onSaveNewAddress,
  userDetails,
  initialAddress,
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const defaultCenter = useMemo(() => ({ lat: 28.6139, lng: 77.2090 }), []);

  const [address, setAddress] = useState(initialAddress);
  const [pinAddressText, setPinAddressText] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);

  // Ref to hold setValue from AddressAutocomplete
  const addressSearchSetValueRef = useRef(null);

  // Track if user has manually chosen a location
  const hasManualLocationRef = useRef(false);

  useEffect(() => {
    const initial = initialAddress;
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
      const latLng = { lat, lng };
      setMarkerPosition(latLng);
      setMapCenter(latLng);
      setPinAddressText(
        initial.addressLine1
          ? `Current pin: ${initial.addressLine1}`
          : "Coordinates set."
      );
    } else {
      setMarkerPosition(null);
      setMapCenter(defaultCenter);
    }
  }, [initialAddress, isLoaded, defaultCenter]);

  const updateLocationAndAddress = useCallback(
    async (lat, lng, pan = true, isGeolocated = false, addressSourceText = null) => {
      const latLng = { lat, lng };
      setMarkerPosition(latLng);
      setMapCenter(latLng);

      try {
        const results = await getGeocode({ location: latLng });
        const components = results[0]?.address_components || [];
        const addressDescription =
          results[0]?.formatted_address || "Pinned Location";

        setPinAddressText(`Current pin: ${addressDescription}`);

        // Update AddressAutocomplete input text, but do NOT trigger new suggestions
        if (addressSearchSetValueRef.current) {
          addressSearchSetValueRef.current(addressDescription, false);
        }

        const [city, state, country, pincode, countryCodeFound] = (function () {
          let city = "", state = "", country = "", pincode = "", countryCodeFound = "";
          for (const component of components) {
            if (component.types.includes("locality")) city = component.long_name;
            if (component.types.includes("administrative_area_level_1")) state = component.short_name;
            if (component.types.includes("country")) {
              country = component.long_name;
              countryCodeFound = component.short_name;
            }
            if (component.types.includes("postal_code")) pincode = component.long_name;
          }
          return [city, state, country, pincode, countryCodeFound];
        })();

        let newAddr = {
          city,
          state,
          country,
          pincode,
          location: { type: "Point", coordinates: [lng, lat] },
        };

        const phoneCodeObj = countryCodeFound
          ? COUNTRY_DATA.find((c) => c.iso2 === countryCodeFound)
          : null;

        setAddress((prev) => ({
          ...prev,
          ...newAddr,
          addressLine1: addressSourceText
            ? addressSourceText.split(",")[0].trim()
            : prev.addressLine1,
          countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode,
          country: newAddr.country || prev.country,
          phone: isGeolocated ? userDetails.phone : prev.phone,
          firstName: isGeolocated
            ? userDetails.name?.split(" ")[0]
            : prev.firstName,
        }));

        if (mapRef.current && pan) {
          mapRef.current.panTo(latLng);
        }
      } catch (error) {
        console.error("Reverse Geocode failed:", error);
        setAddress((prev) => ({
          ...prev,
          location: { type: "Point", coordinates: [lng, lat] },
        }));
      }
    },
    [userDetails]
  );

  const locateUser = useCallback(
    (initial) => {
      if (!navigator.geolocation) return;
      setIsLocating(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          hasManualLocationRef.current = true;

          const { latitude, longitude } = position.coords;
          updateLocationAndAddress(latitude, longitude, true, true, null);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation failed:", error);
          const selectedCountry = COUNTRY_DATA.find(
            (c) => c.code === initial?.countryCode
          );
          if (isLoaded && selectedCountry) {
            setMapCenter({ lat: selectedCountry.lat, lng: selectedCountry.lng });
          } else if (isLoaded) {
            setMapCenter(defaultCenter);
          }
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    },
    [isLoaded, defaultCenter, updateLocationAndAddress]
  );

  const handlePlaceSelect = useCallback(
    (addressDescription, latLng) => {
      hasManualLocationRef.current = true;
      updateLocationAndAddress(
        latLng.lat,
        latLng.lng,
        true,
        false,
        addressDescription
      );
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
      if (mapRef.current) {
        mapRef.current.setZoom(5);
      }
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

  const handleChange = (field, value) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  const handleSave = (e) => {
    e.preventDefault();
    if (
      !address.label ||
      !address.addressLine1 ||
      !address.city ||
      !address.country ||
      !address.phone ||
      !address.firstName
    ) {
      alert("Please fill all required address fields.");
      return;
    }
    if (!markerPosition) {
      if (
        !window.confirm(
          "Address coordinates are not set (pin missing on map). Save without coordinates?"
        )
      ) {
        return;
      }
    }
    onSaveNewAddress(address);
  };

  if (loadError) return <div>Error loading maps.</div>;

  return (
    <div className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3">Add New Address Details</h3>
      <form onSubmit={handleSave} className="grid gap-4 py-4">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Address Label (e.g., Home, Work)</Label>
          <Input
            value={address.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Home"
            required
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country-search">Country/Region</Label>
          <CountryCombobox
            value={address.country || ""}
            onChange={handleCountryNameSelect}
          />
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              value={address.firstName || ""}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="First Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              value={address.lastName || ""}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Last Name"
            />
          </div>
        </div>

        {/* Address + Map */}
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
            onClick={() => locateUser(address)}
            disabled={isLocating || !isLoaded}
            className="mt-1 flex items-center justify-center w-full"
          >
            {isLocating ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <LocateFixed className="h-4 w-4 mr-2" />
            )}
            {isLocating ? "Locating you..." : "Locate Me"}
          </Button>

          <div className="h-[250px] w-full rounded-md overflow-hidden border relative mt-2">
            {isLoaded ? (
              <GoogleMap
                zoom={markerPosition ? 15 : address.country ? 8 : 5}
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
                  <Loader2 className="animate-spin h-8 w-8 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-10" />
                )}
              </GoogleMap>
            ) : (
              <div className="p-4 text-center flex justify-center items-center h-full">
                {isLocating ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {isLocating ? "Locating you..." : "Loading map..."}
              </div>
            )}
          </div>

          {pinAddressText && (
            <Alert className="mt-2 text-xs">
              <MapPin className="h-4 w-4" />
              <AlertDescription>{pinAddressText}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2">
          <Label htmlFor="addressLine2">
            Apartment, suite, unit, building (Optional)
          </Label>
          <Input
            value={address.addressLine2 || ""}
            onChange={(e) => handleChange("addressLine2", e.target.value)}
            placeholder="Apartment, suite, etc."
          />
        </div>

        {/* City/State/Pincode */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              value={address.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State/Region</Label>
            <Input
              value={address.state || ""}
              onChange={(e) => handleChange("state", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">PIN code</Label>
            <Input
              value={address.pincode || ""}
              onChange={(e) => handleChange("pincode", e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="addressPhone">Mobile number (for delivery)</Label>
          <div className="flex space-x-2">
            <CountryCodeSelector
              value={address.countryCode || COUNTRY_DATA[0].code}
              onChange={handleCountryCodeChange}
            />
            <Input
              value={address.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Mobile number"
              type="tel"
              required
            />
          </div>
        </div>

        {address.addressLine1 && (
          <Alert className="mt-4 text-sm">
            <MapPin className="h-4 w-4" />
            <AlertTitle>Selected Address Details</AlertTitle>
            <AlertDescription>
              <div className="font-medium">{address.label || 'New Address'}</div>
              <div>{address.firstName} {address.lastName}</div>
              <div>{address.addressLine1} {address.addressLine2 ? `(${address.addressLine2})` : ''}</div>
              <div>{address.city} - {address.pincode}, {address.state}, {address.country}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Phone: {address.countryCode} {address.phone}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save and Select Address</Button>
        </DialogFooter>
      </form>
    </div>
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
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsMenuOpen(true);
    onChange(newValue);
  };

  const handleSelect = (countryName) => {
    setInputValue(countryName);
    setIsMenuOpen(false);
    onChange(countryName);
  };

  return (
    <div className="relative z-30" ref={wrapperRef}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsMenuOpen(true)}
        placeholder="Type country name or select..."
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
                  className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
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
    // Restrict searches to Indian subcontinent countries
    requestOptions: {
      componentRestrictions: {
        country: ["in", "pk", "bd", "np", "bt", "lk", "mv", "af"],
      },
    },
    debounce: 300,
  });

  // Expose setValue to parent via ref so map updates can sync the input
  useEffect(() => {
    if (setExternalValueRef) {
      setExternalValueRef.current = setValue;
      return () => {
        setExternalValueRef.current = null;
      };
    }
  }, [setValue, setExternalValueRef]);

  const handleSelect = async (addressDescription) => {
    // Update input text immediately, but don't trigger a new autocomplete query
    setValue(addressDescription, false);
    clearSuggestions();

    try {
      const geocodeResults = await getGeocode({ address: addressDescription });
      const { lat, lng } = await getLatLng(geocodeResults[0]);
      onSelect(addressDescription, { lat, lng });
    } catch (error) {
      console.error("Error fetching coordinates: ", error);
      alert("Could not fetch coordinates for the selected address.");
    }
  };

  return (
    <div className="relative z-20">
      <Input
        id="addressSearch"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Start typing your street address..."
        disabled={!ready}
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
// -----------------------------------------------------------
// END: SHARED UTILITY COMPONENTS
// -----------------------------------------------------------
