import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/router";
import RetailerLayout from "../../../../components/RetailerLayout";
import TagsInput from "../../../../components/TagsInput";
import { useAuthGuard } from "../../../../hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  Upload,
  X,
  Lock,
  MapPin,
  User,
  LocateFixed,
  Globe as GlobeIcon,
  Phone as PhoneIcon,
  Check,
  PlusCircle,
} from "lucide-react";

// MAP/PLACES IMPORTS
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const libraries = ["places"];

// --- COUNTRY DATA ---
const COUNTRY_DATA = [
  { country: "India", code: "+91", flag: "🇮🇳", lat: 20.5937, lng: 78.9629, iso2: "IN" },
].sort((a, b) => a.country.localeCompare(b.country));

// --- Helper to decode user info from token ---
function getUserInfoFromToken() {
  if (typeof window === "undefined") return { id: null, email: null, isLoggedIn: false };
  const token = localStorage.getItem("token");
  if (!token) return { id: null, email: null, isLoggedIn: false };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.id, email: payload.email, isLoggedIn: true };
  } catch (e) {
    return { id: null, email: null, isLoggedIn: false };
  }
}

// Helper to check if locationData has coordinates
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [brand, setBrand] = useState("");
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
  const [sizeChartName, setSizeChartName] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  
  const [isWholesaleSourced, setIsWholesaleSourced] = useState(false);

  // Helper: Maps a User Profile Address (addressLine1) -> Product Warehouse Format
  const mapAddressToWarehouse = useCallback((address) => {
    if (!address || !address.location || !address.location.coordinates) return null;
    return {
      address: `${address.label}: ${address.addressLine1} ${address.addressLine2 || ""}`,
      location: { type: "Point", coordinates: address.location.coordinates },
      city: address.city,
      state: address.state,
      country: address.country,
    };
  }, []);

  const findMatchingAddressId = useCallback((productWarehouse, addresses) => {
    if (!productWarehouse || !addresses || addresses.length === 0) return null;
    const [lng, lat] = productWarehouse.location?.coordinates || [0, 0];
    if (lng === 0 && lat === 0) return null;

    const match = addresses.find((addr) => {
      const [addrLng, addrLat] = addr.location?.coordinates || [null, null];
      return (
        addrLng != null &&
        addrLat != null &&
        Math.round(addrLng * 1000) === Math.round(lng * 1000) &&
        Math.round(addrLat * 1000) === Math.round(lat * 1000)
      );
    });
    return match ? match._id.toString() : null;
  }, []);

  const handleSaveNewAddressToProfile = useCallback(async (newAddress) => {
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ addresses: updatedAddresses }),
        });
        if (!res.ok) throw new Error("Failed to save new address.");
        const { user: updatedUser } = await res.json();
        setUserAddresses(updatedUser.addresses);
        const newAddressId = updatedUser.addresses[updatedUser.addresses.length - 1]._id.toString();
        setSelectedAddressId(newAddressId);
        setLocationData(mapAddressToWarehouse(updatedUser.addresses.find((a) => a._id.toString() === newAddressId)));
        setIsAddressModalOpen(false);
      } catch (err) {
        console.error(err);
        setError(`Error saving address: ${err.message}`);
      }
    }, [mapAddressToWarehouse]);

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
      const authHeaders = { Authorization: `Bearer ${token}` };

      try {
        const productRes = await fetch(`/api/retailer/products/${productId}`, { headers: authHeaders });
        if (!productRes.ok) {
          const errData = await productRes.json();
          throw new Error(errData.error || "Failed to fetch product data.");
        }
        const { product } = await productRes.json();

        const addressesRes = await fetch("/api/user/profile", { headers: authHeaders });
        if (!addressesRes.ok) throw new Error("Failed to fetch user addresses.");
        const { user } = await addressesRes.json();
        
        setUserAddresses(user.addresses || []);
        setUserDetails(user);
        setAddressesLoading(false);

        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price?.toString() || "");
        setDiscount(product.discount?.toString() || "0");
        setBrand(product.brand || "");
        setTags(product.tags || []);

        const loadedSizes = product.sizes || [{ size: "S", sku: "", stock: 0 }];
        setSizes(loadedSizes);
        setOriginalSizes(JSON.parse(JSON.stringify(loadedSizes)));

        setExistingImages(product.images || []);
        setSizeChartName(product.sizeChart?.chartName || "");
        setExistingSizeChart(product.sizeChart?.image || null);
        setIsPublished(product.isPublished || false);
        setIsWholesaleSourced(!!product.wholesaleSourceId); 

        // 3. Match and Set Location State
        const productWarehouse = product.warehouses?.[0];
        
        if (productWarehouse?.location?.coordinates) {
          // --- FIX: Use warehouse data DIRECTLY ---
          // Do not use mapAddressToWarehouse() here because productWarehouse
          // already has the correct structure (address string, city, etc.)
          setLocationData(productWarehouse); 

          // Try to find if this matches a saved user address to highlight it in the modal
          const matchId = findMatchingAddressId(productWarehouse, user.addresses || []);
          setSelectedAddressId(matchId || "choose");
        } else if (user.addresses?.length > 0) {
          // Fallback: Default to first user address if product has no location set
          setSelectedAddressId(user.addresses[0]._id.toString());
          setLocationData(mapAddressToWarehouse(user.addresses[0]));
        } else {
          setSelectedAddressId("choose");
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

  const handleAddressSelectionFromModal = (addressId) => {
    setSelectedAddressId(addressId);
    setError(null);
    const selected = userAddresses.find((addr) => addr._id.toString() === addressId);
    setLocationData(selected ? mapAddressToWarehouse(selected) : null);
    setIsAddressModalOpen(false);
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    if (field === "stock") {
        if (isWholesaleSourced) return; 
        newSizes[index][field] = Number(value);
    } else {
        if (field === "size" && isWholesaleSourced) return;
        newSizes[index][field] = value;
    }
    setSizes(newSizes);
  };
  
  const addSize = () => {
    setSizes((prev) => [...prev, { size: "New", sku: "", stock: 0 }]);
  };

  const removeSize = (index) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
    setOriginalSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
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
    files.forEach((file) => formData.append(fieldName, file));
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) throw new Error("File upload failed");
    return await uploadRes.json();
  };

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
    let newSizeChartUrl = "";

    try {
      if (imageFiles.length > 0) {
        const uploadData = await uploadFiles("productImages", imageFiles);
        newImageUrls = uploadData.urls?.productImages || [];
      }
      if (sizeChartFile) {
        const uploadData = await uploadFiles("productImage", [sizeChartFile]);
        newSizeChartUrl = uploadData.urls?.productImage?.[0] || "";
      }

      setIsUploading(false);

      const productData = {
        name, description,
        price: Number(price),
        discount: Number(discount) || 0,
        brand,
        images: [...existingImages, ...newImageUrls],
        sizes, 
        tags,
        sizeChart: { chartName: sizeChartName, image: newSizeChartUrl || existingSizeChart },
        warehouses: [locationData],
        isPublished,
      };

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`/api/retailer/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update product");
      }

      if (isPublished) router.push("/retailer/products");
      else router.push("/retailer/inventory");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const currentAddress = locationData;
  const finalPrice = Number(price) - Number(price) * (Number(discount) / 100);
  
  if (isAuthLoading || isFetching) {
    return <RetailerLayout><div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div></RetailerLayout>;
  }

  return (
    <RetailerLayout>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => router.push("/retailer/inventory")}>Cancel</Button>
            <Button type="submit" disabled={loading || isUploading}>
              {(loading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : isUploading ? "Uploading..." : "Save Changes"}
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
            <Card>
              <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Product Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Selling Price (₹)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                    <div className="space-y-2"><Label>Discount (%)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min="0" max="100" placeholder="0" /></div>
                    <div className="space-y-2"><Label className="text-muted-foreground">Final Price</Label><div className="h-10 px-3 py-2 rounded-md border bg-gray-50 text-green-600 font-bold">₹{finalPrice.toLocaleString("en-IN")}</div></div>
                  </div>
                  <div className="space-y-2"><Label>Brand Name</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Categories / Tags</Label><TagsInput tags={tags} setTags={setTags} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Store Location</CardTitle><CardDescription>Select a previously saved address.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {addressesLoading ? <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading addresses...</div> : (
                  <>
                    <div className="space-y-2">
                      <Label>Choose Store Address</Label>
                      <Button type="button" variant="outline" className="w-full justify-between h-12 text-left" onClick={() => setIsAddressModalOpen(true)} disabled={addressesLoading}>
                        {currentAddress && isLocationSet(currentAddress) ? (
                          <span className="truncate">
                            {/* Safely handle address string split */}
                            <span className="font-bold mr-2 text-primary">{(currentAddress.address || "").split(":")[0]}</span>
                            {currentAddress.city}, {currentAddress.country}
                          </span>
                        ) : <span className="text-muted-foreground">Click to select...</span>}
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Size Variants & Stock</CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center mt-1">
                  {isWholesaleSourced ? (
                    <span className="text-amber-600 font-semibold flex items-center">
                       <Lock className="h-3 w-3 mr-1" /> 
                       Managed by Wholesaler. You cannot edit stock manually.
                    </span>
                  ) : (
                    "Manage your size variants and stock levels."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sizes.map((size, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-2">
                      <Label>Size</Label>
                      <Input 
                        value={size.size} 
                        onChange={e => handleSizeChange(index, 'size', e.target.value)} 
                        disabled={isWholesaleSourced} 
                        className={isWholesaleSourced ? "bg-gray-100 text-gray-500" : ""} 
                      />
                    </div>
                    <div className="col-span-5 space-y-2">
                      <Label>SKU</Label>
                      <Input value={size.sku} onChange={(e) => handleSizeChange(index, "sku", e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={size.stock}
                        onChange={(e) => handleSizeChange(index, "stock", e.target.value)}
                        disabled={isWholesaleSourced} 
                        className={isWholesaleSourced ? "bg-gray-100 text-gray-500 font-mono cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        type="button" 
                        onClick={() => removeSize(index)} 
                        disabled={isWholesaleSourced}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator />
                <Button type="button" onClick={addSize} variant="outline" disabled={isWholesaleSourced}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Another Size
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6 self-start">
            <Card>
              <CardHeader><CardTitle>Publishing Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} />
                  <Label htmlFor="isPublished">Publish to Shop</Label>
                </div>
                <p className="text-sm text-muted-foreground">{isPublished ? "Product is live." : "Product is in inventory (draft)."}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Product Gallery</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img src={imageUrl} alt={`Existing ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeExistingImage(index)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative">
                      <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeNewImage(index)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6"><Upload className="w-8 h-8 mb-4 text-gray-500" /><p className="text-sm text-gray-500">Click to upload</p></div>
                  <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg" multiple />
                </Label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Size Chart</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Chart Name (Optional)</Label><Input value={sizeChartName} onChange={(e) => setSizeChartName(e.target.value)} placeholder="e.g., Men's Chart" /></div>
                <Label htmlFor="size-chart-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative">
                  {sizeChartPreview ? <img src={sizeChartPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" /> : existingSizeChart ? <img src={existingSizeChart} alt="Existing" className="w-full h-full object-cover rounded-lg" /> : <div className="flex flex-col items-center justify-center pt-5 pb-6"><Upload className="w-8 h-8 text-gray-500" /><p className="text-sm text-gray-500">Upload Chart</p></div>}
                  <Input id="size-chart-file" type="file" className="hidden" onChange={handleSizeChartChange} accept="image/png, image/jpeg" />
                </Label>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

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

// --- SHARED COMPONENTS ---
function AddressSelectionAndCreationModal({ isOpen, onClose, addresses, currentSelectedId, onAddressSelect, onSaveNewAddress, userDetails }) {
  const [mode, setMode] = useState("selection"); 
  const [selectedId, setSelectedId] = useState(currentSelectedId);

  useEffect(() => {
    setSelectedId(currentSelectedId);
    if (isOpen) setMode("selection");
  }, [currentSelectedId, isOpen]);

  const handleApply = () => { if (selectedId) { onAddressSelect(selectedId); onClose(); } };
  const handleNewAddressComplete = (newAddress) => { onSaveNewAddress(newAddress); setMode("selection"); };

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
              countryCode: "+91",
              addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "India",
              location: { type: "Point", coordinates: [0, 0] },
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-6">
        <DialogHeader><DialogTitle className="text-xl">Choose location</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pt-2">
          {addresses.length === 0 ? <div className="p-4 text-center text-muted-foreground border rounded-md">No addresses found.</div> : addresses.map((addr) => (
            <Card key={addr._id.toString()} onClick={() => setSelectedId(addr._id.toString())} className={`p-3 cursor-pointer transition-colors ${selectedId === addr._id.toString() ? "border-2 border-blue-500 ring-2 ring-blue-200" : "border border-gray-300 hover:border-blue-300"}`}>
              <div className="flex items-start">
                <div className={`font-extrabold text-sm uppercase mr-2 ${selectedId === addr._id.toString() ? "text-blue-600" : "text-gray-800"}`}>{addr.label || "Default"}</div>
                <div className="flex-1 text-sm"><div className="font-semibold">{addr.firstName} {addr.lastName}</div><div className="text-gray-600">{addr.addressLine1}, {addr.city} {addr.pincode}</div></div>
              </div>
            </Card>
          ))}
          <Button variant="link" className="p-0 text-blue-600 justify-start" onClick={() => setMode("creation")}>+ Add a new address</Button>
        </div>
        <DialogFooter className="mt-4"><Button type="button" onClick={handleApply} disabled={!selectedId || addresses.length === 0} className="w-full">Apply Location</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddressCreationForm({ onCancel, onSaveNewAddress, userDetails, initialAddress }) {
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, libraries });
  const defaultCenter = useMemo(() => ({ lat: 28.6139, lng: 77.209 }), []);
  const [address, setAddress] = useState(initialAddress);
  const [pinAddressText, setPinAddressText] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const addressSearchSetValueRef = useRef(null);
  const hasManualLocationRef = useRef(false);

  useEffect(() => {
    const initial = initialAddress;
    setAddress(initial);
    hasManualLocationRef.current = false;
    const initialCoords = initial.location?.coordinates;
    if (initialCoords && initialCoords[0] && initialCoords[1] && initialCoords[0] !== 0) {
      const [lng, lat] = initialCoords;
      setMarkerPosition({ lat, lng });
      setMapCenter({ lat, lng });
      setPinAddressText(initial.addressLine1 ? `Current pin: ${initial.addressLine1}` : "Coordinates set.");
    } else {
      setMarkerPosition(null);
      setMapCenter(defaultCenter);
    }
  }, [initialAddress, isLoaded, defaultCenter]);

  const updateLocationAndAddress = useCallback(async (lat, lng, pan = true, isGeolocated = false, addressSourceText = null) => {
    const latLng = { lat, lng };
    setMarkerPosition(latLng);
    setMapCenter(latLng);
    try {
      const results = await getGeocode({ location: latLng });
      const components = results[0]?.address_components || [];
      const addressDescription = results[0]?.formatted_address || "Pinned Location";
      setPinAddressText(`Current pin: ${addressDescription}`);
      if (addressSearchSetValueRef.current) addressSearchSetValueRef.current(addressDescription, false);

      let newAddr = { city: "", state: "", country: "", pincode: "", location: { type: "Point", coordinates: [lng, lat] } };
      let countryCodeFound = "";
      for (const component of components) {
        if (component.types.includes("locality")) newAddr.city = component.long_name;
        if (component.types.includes("administrative_area_level_1")) newAddr.state = component.short_name;
        if (component.types.includes("country")) { newAddr.country = component.long_name; countryCodeFound = component.short_name; }
        if (component.types.includes("postal_code")) newAddr.pincode = component.long_name;
      }

      const phoneCodeObj = countryCodeFound ? COUNTRY_DATA.find((c) => c.iso2 === countryCodeFound) : null;
      setAddress((prev) => ({
        ...prev,
        ...newAddr,
        addressLine1: addressSourceText ? addressSourceText.split(",")[0].trim() : prev.addressLine1,
        countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode,
        country: newAddr.country || prev.country,
        phone: isGeolocated ? userDetails.phone : prev.phone,
        firstName: isGeolocated ? userDetails.name?.split(" ")[0] : prev.firstName,
      }));

      if (mapRef.current && pan) mapRef.current.panTo(latLng);
    } catch (error) {
      console.error("Reverse Geocode failed:", error);
      setAddress((prev) => ({ ...prev, location: { type: "Point", coordinates: [lng, lat] } }));
    }
  }, [userDetails]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (hasManualLocationRef.current) { setIsLocating(false); return; }
        const { latitude, longitude } = position.coords;
        updateLocationAndAddress(latitude, longitude, true, true, null);
        setIsLocating(false);
      },
      (error) => { console.warn(error); setIsLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [updateLocationAndAddress]);

  const handlePlaceSelect = useCallback((addressDescription, latLng) => {
    hasManualLocationRef.current = true;
    updateLocationAndAddress(latLng.lat, latLng.lng, true, false, addressDescription);
  }, [updateLocationAndAddress]);

  const handleMapClick = useCallback((e) => { hasManualLocationRef.current = true; updateLocationAndAddress(e.latLng.lat(), e.latLng.lng()); }, [updateLocationAndAddress]);
  const handleMarkerDragEnd = useCallback((e) => { hasManualLocationRef.current = true; updateLocationAndAddress(e.latLng.lat(), e.latLng.lng()); }, [updateLocationAndAddress]);
  const handleChange = (field, value) => setAddress((prev) => ({ ...prev, [field]: value }));
  const handleSave = (e) => { e.preventDefault(); onSaveNewAddress(address); };

  if (loadError) return <div>Error loading maps.</div>;

  return (
    <div className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3">Add New Address</h3>
      <form onSubmit={handleSave} className="grid gap-4 py-4">
        <div className="space-y-2"><Label>Label</Label><Input value={address.label || ""} onChange={(e) => handleChange("label", e.target.value)} required /></div>
        <div className="space-y-2"><Label>Address</Label><AddressAutocomplete onSelect={handlePlaceSelect} setExternalValueRef={addressSearchSetValueRef} />
          <Button type="button" variant="outline" size="sm" onClick={locateUser} disabled={isLocating || !isLoaded} className="mt-1 w-full">{isLocating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <LocateFixed className="h-4 w-4 mr-2" />} Locate Me</Button>
          <div className="h-[200px] w-full rounded-md overflow-hidden border relative mt-2">
            {isLoaded ? <GoogleMap zoom={markerPosition ? 15 : 5} center={mapCenter} mapContainerClassName="w-full h-full" onClick={handleMapClick} onLoad={(map) => (mapRef.current = map)}>{markerPosition && <Marker position={markerPosition} draggable={true} onDragEnd={handleMarkerDragEnd} />}{isLocating && <Loader2 className="animate-spin h-8 w-8 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-10" />}</GoogleMap> : <div className="p-4 text-center">Loading map...</div>}
          </div>
          {pinAddressText && <Alert className="mt-2 text-xs"><MapPin className="h-4 w-4" /><AlertDescription>{pinAddressText}</AlertDescription></Alert>}
        </div>
        <div className="space-y-2"><Label>Apt/Suite</Label><Input value={address.addressLine2 || ""} onChange={(e) => handleChange("addressLine2", e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>City</Label><Input value={address.city || ""} onChange={(e) => handleChange("city", e.target.value)} required /></div>
          <div className="space-y-2"><Label>State</Label><Input value={address.state || ""} onChange={(e) => handleChange("state", e.target.value)} /></div>
          <div className="space-y-2"><Label>PIN</Label><Input value={address.pincode || ""} onChange={(e) => handleChange("pincode", e.target.value)} /></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">Save Address</Button></DialogFooter>
      </form>
    </div>
  );
}

function AddressAutocomplete({ onSelect, setExternalValueRef }) {
  const { ready, setValue, suggestions: { status, data }, clearSuggestions } = usePlacesAutocomplete({ requestOptions: { componentRestrictions: { country: "in" } }, debounce: 300 });
  useEffect(() => { if (setExternalValueRef) { setExternalValueRef.current = setValue; return () => (setExternalValueRef.current = null); } }, [setValue, setExternalValueRef]);
  const handleSelect = async (addressDescription) => {
    setValue(addressDescription, false); clearSuggestions();
    try {
      const results = await getGeocode({ address: addressDescription });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(addressDescription, { lat, lng });
    } catch (error) { console.error("Error:", error); }
  };
  return (
    <div className="relative z-20">
      <Input id="addressSearch" onChange={(e) => setValue(e.target.value)} disabled={!ready} placeholder="Start typing address..." />
      {status === "OK" && <Card className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-60 overflow-y-auto"><ul className="divide-y">{data.map(({ place_id, description }) => (<li key={place_id} onClick={() => handleSelect(description)} className="p-3 hover:bg-gray-50 cursor-pointer text-sm">{description}</li>))}</ul></Card>}
    </div>
  );
}

function CountryCombobox({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const wrapperRef = useRef(null);
  useEffect(() => setInputValue(value), [value]);
  const filteredCountries = useMemo(() => {
    if (!inputValue) return COUNTRY_DATA;
    return COUNTRY_DATA.filter(c => c.country.toLowerCase().includes(inputValue.toLowerCase()) || c.code.includes(inputValue));
  }, [inputValue]);
  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsMenuOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleInputChange = (e) => { const val = e.target.value; setInputValue(val); setIsMenuOpen(true); onChange(val); };
  const handleSelect = (countryName) => { setInputValue(countryName); setIsMenuOpen(false); onChange(countryName); };
  return (
    <div className="relative z-30" ref={wrapperRef}>
      <Input value={inputValue} onChange={handleInputChange} onFocus={() => setIsMenuOpen(true)} placeholder="Type country name..." required />
      {isMenuOpen && <Card className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-60 overflow-y-auto"><ul className="divide-y">{filteredCountries.length > 0 ? filteredCountries.map((c) => (<li key={c.country} onClick={() => handleSelect(c.country)} className="p-3 hover:bg-gray-50 cursor-pointer text-sm"><span className="font-medium">{c.flag} {c.country}</span></li>)) : <li className="p-3 text-sm text-muted-foreground">No matches.</li>}</ul></Card>}
    </div>
  );
}

function CountryCodeSelector({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="flex h-9 w-40 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm shrink-0">
      {COUNTRY_DATA.map((c) => (<option key={c.code} value={c.code}>{c.flag} {c.country} ({c.code})</option>))}
    </select>
  );
}