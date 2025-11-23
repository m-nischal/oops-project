import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/router";
import RetailerLayout from "../../components/RetailerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Loader2,
  ShoppingCart,
  Check,
  CheckCircle,
  Search,
  Filter,
  MapPin,
  Truck,
  ChevronsLeft,
  ChevronsRight,
  Timer,
  CreditCard,
  Send,
  QrCode,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useAuthGuard } from "../../hooks/useAuthGuard";

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
const PRODUCTS_PER_PAGE = 12;
const CATEGORY_OPTIONS = ["Men", "Women", "Unisex", "Boys", "Girls"];

// --- HELPERS ---
function getEstimatedDeliveryDate(distKm) {
  if (distKm === Infinity || distKm === null || distKm === undefined)
    return null;
  const transitDays = 2 + Math.ceil(distKm / 500);
  const date = new Date();
  date.setDate(date.getDate() + transitDays);
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function totalStockFrom(product = {}) {
  if (Array.isArray(product.sizes)) {
    return product.sizes.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  }
  return product.totalStock || 0;
}

function formatCardNumberDisplay(value) {
  const cleaned = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 16);
  return cleaned.match(/.{1,4}/g)?.join(" ") || "";
}

function validateCard(details) {
  const cleanedNumber = String(details.number || "")
    .replace(/\s/g, "")
    .slice(0, 16);
  const cleanedCvv = String(details.cvv || "")
    .replace(/\D/g, "")
    .slice(0, 3);
  const cleanedName = String(details.name || "").trim();

  if (cleanedNumber.length !== 16)
    return "Card number must be exactly 16 digits.";
  if (cleanedCvv.length !== 3) return "CVV must be exactly 3 digits.";

  const [monthStr, yearStr] = details.expiry.split("/");
  if (!monthStr || !yearStr || monthStr.length !== 2 || yearStr.length !== 2)
    return "Expiry date must be in MM/YY format.";

  const month = Number(monthStr);
  const year = Number(yearStr);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;

  if (month < 1 || month > 12) return "Expiry month is invalid (01-12).";
  if (year < currentYear) return "Card has expired.";

  if (cleanedName.length === 0) return "Cardholder name cannot be empty.";
  if (/[^a-zA-Z\s]/.test(cleanedName))
    return "Cardholder name can only contain alphabets and spaces.";
  return null;
}

function validateUpiId(id) {
  if (!id.includes("@")) return "UPI ID must contain '@'.";
  return null;
}

function generateMockOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const PAYMENT_OPTIONS = [
  { id: "COD", label: "Cash on Delivery (COD)", icon: Truck },
  { id: "Card", label: "Credit/Debit Card", icon: CreditCard },
  { id: "UPI_ID", label: "UPI ID (PhonePe/GPay)", icon: Send },
  { id: "UPI_QR", label: "UPI Scan (QR Code)", icon: QrCode },
];

// --- MAIN COMPONENT ---
export default function StockFromWholesalerPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [retailerAddresses, setRetailerAddresses] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderSize, setOrderSize] = useState("");
  const [orderQty, setOrderQty] = useState(10);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [stockedProductIds, setStockedProductIds] = useState(new Set());

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    PAYMENT_OPTIONS[0].id
  );
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [showCardModal, setShowCardModal] = useState(false);
  const [showUpiIdModal, setShowUpiIdModal] = useState(false);
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const [mockOtp, setMockOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [paymentError, setPaymentError] = useState(null);
  const otpTimerRef = useRef(null);

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  // 1. Fetch Profile & Init
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const addrs = data.user?.addresses || [];
          setRetailerAddresses(addrs);
          if (addrs.length > 0) {
            setSelectedLocationId(addrs[0]._id);
            if (addrs[0].location?.coordinates) {
              setCurrentLocation({
                lng: addrs[0].location.coordinates[0],
                lat: addrs[0].location.coordinates[1],
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!isAuthLoading) fetchProfile();
  }, [isAuthLoading]);

  // --- FIX: Sync URL Search Param IMMEDIATELY ---
  useEffect(() => {
    if (router.isReady && router.query.q) {
      const query = router.query.q;
      setSearchQuery(query);
      setDebouncedSearch(query); // Force update debounced value to skip delay
    }
  }, [router.isReady, router.query.q]);

  const handleLocationChange = (id) => {
    setSelectedLocationId(id);
    const addr = retailerAddresses.find((a) => a._id === id);
    if (addr && addr.location?.coordinates) {
      setCurrentLocation({
        lng: addr.location.coordinates[0],
        lat: addr.location.coordinates[1],
      });
    } else {
      setCurrentLocation(null);
    }
  };

  // Debounce Search (Only if typed manually)
  useEffect(() => {
    // Don't debounce if the values are already the same (e.g. set by URL effect)
    if (searchQuery === debouncedSearch) return;

    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // Fetch Products
  useEffect(() => {
    if (isAuthLoading) return;
    async function fetchProducts() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const authHeaders = { Authorization: `Bearer ${token}` };
        let apiSort = sortOption === "distance" ? "newest" : sortOption;

        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: PRODUCTS_PER_PAGE.toString(),
          sort: apiSort,
          ...(debouncedSearch && { q: debouncedSearch }),
          ...(selectedCategory !== "All" && { category: selectedCategory }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(currentLocation && {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
          }),
        });

        const res = await fetch(
          `/api/retailer/wholesale-products?${queryParams.toString()}`,
          { headers: authHeaders }
        );
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.items);
        setTotalProducts(data.total);
      } catch (err) {
        setError("Could not load products.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [
    page,
    debouncedSearch,
    sortOption,
    selectedCategory,
    minPrice,
    maxPrice,
    currentLocation,
    isAuthLoading,
  ]);

  const handleOpenOrder = (product) => {
    setSelectedProduct(product);
    if (product.sizes && product.sizes.length > 0)
      setOrderSize(product.sizes[0].size);
    setOrderQty(product.minOrderQuantity || 1);
    setSelectedPaymentMethod(PAYMENT_OPTIONS[0].id);
  };

  const handlePaymentSelection = () => {
    const minQty = selectedProduct.minOrderQuantity || 1;
    if (!selectedProduct || !orderSize) return;
    if (Number(orderQty) < minQty) {
      alert(`Minimum Order Quantity is ${minQty}.`);
      return;
    }

    if (selectedPaymentMethod === "Card") {
      setShowCardModal(true);
    } else if (selectedPaymentMethod === "UPI_ID") {
      setShowUpiIdModal(true);
    } else if (selectedPaymentMethod === "UPI_QR") {
      setShowUpiQrModal(true);
    } else {
      processOrderPlacement("COD");
    }
  };

  const handleDetailsConfirmed = () => {
    setPaymentError(null);
    setOtpInput("");
    setMockOtp(generateMockOtp());
    setOtpTimer(30);
    setIsOtpModalOpen(true);
  };

  const handleVerifyAndOrder = async () => {
    if (otpInput !== mockOtp) {
      setPaymentError("Invalid OTP.");
      return;
    }
    setIsOtpModalOpen(false);
    const methodLabel =
      selectedPaymentMethod === "Card" ? "Credit Card" : `UPI (${upiId})`;
    await processOrderPlacement(methodLabel);
  };

  const handleQrSuccess = async () => {
    setShowUpiQrModal(false);
    await processOrderPlacement("UPI (QR Scan)");
  };

  const processOrderPlacement = async (methodDescription) => {
    setIsOrdering(true);
    try {
      const token = localStorage.getItem("token");

      if (selectedPaymentMethod !== "COD") {
        await fetch("/api/payments/mock/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: selectedProduct.price * orderQty,
            method: methodDescription,
          }),
        });
      }

      const res = await fetch("/api/retailer/place-wholesale-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          size: orderSize,
          qty: Number(orderQty),
          payment: {
            paymentId: `PAY_${Date.now()}`,
            method: methodDescription,
            paidAt: selectedPaymentMethod !== "COD" ? new Date() : undefined,
          },
        }),
      });

      if (!res.ok) throw new Error("Order placement failed.");

      setStockedProductIds((prev) => new Set(prev).add(selectedProduct._id));
      setSelectedProduct(null);
      setShowSuccessModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

  return (
    <RetailerLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Wholesale Market
            </h1>
            <p className="text-gray-500 mt-1">
              Browse and stock high-quality products.
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-gray-200 rounded-full pl-12 h-12 shadow-sm placeholder:text-gray-400"
              placeholder="Search by name, brand..."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-gray-300 gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {selectedCategory === "All" ? "Filters" : selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4" align="start">
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <DropdownMenuRadioItem value="All">
                    All Categories
                  </DropdownMenuRadioItem>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <DropdownMenuRadioItem key={cat} value={cat}>
                      {cat}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <div className="my-3 border-t pt-3">
                  <DropdownMenuLabel className="px-0 mb-2">
                    Price Range (₹)
                  </DropdownMenuLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 hidden sm:inline">
                Ship to:
              </span>
              <Select
                value={selectedLocationId}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger className="h-8 w-[160px] border-none bg-transparent shadow-none focus:ring-0 p-0 text-xs font-bold truncate">
                  <SelectValue placeholder="Select Address" />
                </SelectTrigger>
                <SelectContent>
                  {retailerAddresses.length > 0 ? (
                    retailerAddresses.map((addr) => (
                      <SelectItem key={addr._id} value={addr._id}>
                        {addr.label || "Address"} - {addr.city}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No addresses found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">
              Sort by:
            </span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px] rounded-full h-10 border-gray-300">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="distance">
                  Distance: Nearest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => {
              const isStocking =
                selectedProduct &&
                selectedProduct._id === product._id &&
                isOrdering;
              const isStocked = stockedProductIds.has(product._id);
              const distKm = product._distance;

              return (
                <div
                  key={product._id}
                  className="group cursor-pointer"
                  onClick={() => handleOpenOrder(product)}
                >
                  <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0">
                      <div className="bg-[#F0EEED] rounded-[20px] aspect-square mb-4 overflow-hidden relative group-hover:scale-[1.02] transition-transform">
                        <img
                          src={product.images?.[0] || "/images/placeholder.png"}
                          alt={product.name}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                          {product.minOrderQuantity > 1 && (
                            <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                              MOQ: {product.minOrderQuantity}
                            </span>
                          )}
                        </div>
                        {distKm !== Infinity && distKm !== undefined && (
                          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-sm flex items-center gap-2">
                            <div className="bg-blue-50 p-1.5 rounded-full">
                              <Truck className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="flex flex-col leading-none">
                              <span className="text-[10px] text-gray-500 font-medium">
                                Estimated Delivery
                              </span>
                              <span className="text-xs font-bold text-gray-900">
                                {getEstimatedDeliveryDate(distKm)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 px-1">
                        <h3 className="font-bold text-lg truncate leading-tight text-black group-hover:text-gray-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-xl">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-xs text-gray-400">
                              Wholesale Price
                            </span>
                          </div>
                          <Button
                            disabled={isStocking || isStocked}
                            size="icon"
                            className={`rounded-full w-10 h-10 shadow-sm transition-all ${
                              isStocked
                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                : "bg-black text-white hover:scale-110"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOrder(product);
                            }}
                          >
                            {isStocking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isStocked ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <Pagination className="mt-16">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-9 h-9"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page - 1);
                  }}
                  className={
                    page === 1
                      ? "opacity-50 pointer-events-none"
                      : "cursor-pointer hover:bg-gray-100 rounded-full"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive
                  className="rounded-full bg-black text-white"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page + 1);
                  }}
                  className={
                    page >= totalPages
                      ? "opacity-50 pointer-events-none"
                      : "cursor-pointer hover:bg-gray-100 rounded-full"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-9 h-9"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* --- ORDER DIALOG (With Payment Options) --- */}
        <Dialog
          open={
            !!selectedProduct &&
            !isOtpModalOpen &&
            !showCardModal &&
            !showUpiIdModal &&
            !showUpiQrModal
          }
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl items-center border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img
                    src={selectedProduct?.images?.[0]}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <div>
                  <p className="font-bold text-sm line-clamp-1">
                    {selectedProduct?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(selectedProduct?.price)} / unit
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Size Variant</Label>
                  <Select value={orderSize} onValueChange={setOrderSize}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct?.sizes?.map((s) => (
                        <SelectItem key={s.size} value={s.size}>
                          {s.size} ({s.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    min={selectedProduct?.minOrderQuantity || 1}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="font-medium text-gray-500">Total Cost</span>
                <span className="font-black text-3xl">
                  {formatPrice((selectedProduct?.price || 0) * orderQty)}
                </span>
              </div>
              <hr className="border-gray-100" />
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-1 gap-2">
                  {PAYMENT_OPTIONS.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPaymentMethod === option.id
                          ? "border-black bg-gray-50 ring-1 ring-black"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedPaymentMethod(option.id)}
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </div>
                      {selectedPaymentMethod === option.id && (
                        <div className="h-4 w-4 rounded-full bg-black" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedProduct(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePaymentSelection}
                className="bg-black text-white w-full sm:w-auto"
              >
                Proceed to Pay{" "}
                {formatPrice((selectedProduct?.price || 0) * orderQty)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CardInputModal
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          cardDetails={cardDetails}
          setCardDetails={setCardDetails}
          onConfirm={() => {
            setShowCardModal(false);
            handleDetailsConfirmed();
          }}
        />
        <UpiIdInputModal
          isOpen={showUpiIdModal}
          onClose={() => setShowUpiIdModal(false)}
          upiId={upiId}
          setUpiId={setUpiId}
          onConfirm={() => {
            setShowUpiIdModal(false);
            handleDetailsConfirmed();
          }}
        />
        <UpiQrModal
          isOpen={showUpiQrModal}
          onClose={() => setShowUpiQrModal(false)}
          onPaymentSuccess={handleQrSuccess}
          grandTotal={(selectedProduct?.price || 0) * orderQty}
        />

        <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Verification</DialogTitle>
              <DialogDescription>
                Enter the OTP sent to verify your payment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-center">
              <div className="flex items-center justify-center text-red-600 font-bold text-3xl">
                <Timer className="h-6 w-6 mr-2 animate-pulse" /> {otpTimer}s
              </div>
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>[DEV] OTP: {mockOtp}</strong>
                </AlertDescription>
              </Alert>
              <Input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter OTP"
                className="text-center text-2xl tracking-widest"
              />
              {paymentError && (
                <p className="text-red-500 text-sm">{paymentError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOtpModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndOrder}
                disabled={isOrdering}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isOrdering ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Verify & Place Order"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                Stock Added!
              </h2>
              <p className="text-gray-500 mb-8 text-sm">
                Payment successful. Order placed with wholesaler.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg shadow-xl"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </RetailerLayout>
  );
}

// --- SUB-COMPONENTS (Same as provided before) ---
function CardInputModal({
  isOpen,
  onClose,
  cardDetails,
  setCardDetails,
  onConfirm,
}) {
  const [localDetails, setLocalDetails] = useState(cardDetails);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (isOpen) setLocalDetails(cardDetails);
  }, [isOpen, cardDetails]);

  const handleSave = () => {
    const error = validateCard(localDetails);
    if (error) {
      setErr(error);
      return;
    }
    setCardDetails(localDetails);
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Card Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="Card Number"
            value={formatCardNumberDisplay(localDetails.number)}
            onChange={(e) =>
              setLocalDetails({
                ...localDetails,
                number: e.target.value.replace(/\D/g, "").slice(0, 16),
              })
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="MM/YY"
              value={localDetails.expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                setLocalDetails({ ...localDetails, expiry: v });
              }}
              maxLength={5}
            />
            <Input
              placeholder="CVV"
              type="password"
              value={localDetails.cvv}
              onChange={(e) =>
                setLocalDetails({
                  ...localDetails,
                  cvv: e.target.value.slice(0, 3),
                })
              }
            />
          </div>
          <Input
            placeholder="Name on Card"
            value={localDetails.name}
            onChange={(e) =>
              setLocalDetails({
                ...localDetails,
                name: e.target.value.toUpperCase(),
              })
            }
          />
          {err && <p className="text-red-500 text-xs">{err}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Next</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpiIdInputModal({ isOpen, onClose, upiId, setUpiId, onConfirm }) {
  const [localId, setLocalId] = useState(upiId);
  const [err, setErr] = useState("");
  const handleUpiInputChange = (e) => {
    setLocalId(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""));
    setErr("");
  };
  useEffect(() => {
    if (isOpen) setLocalId(upiId);
  }, [isOpen, upiId]);
  const handleSave = () => {
    const error = validateUpiId(localId);
    if (error) {
      setErr(error);
      return;
    }
    setUpiId(localId);
    onConfirm();
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter UPI ID</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="user@bank"
            value={localId}
            onChange={handleUpiInputChange}
          />
          {err && <p className="text-red-500 text-xs">{err}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Next</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpiQrModal({ isOpen, onClose, onPaymentSuccess, grandTotal }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle>Scan to Pay {formatPrice(grandTotal)}</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          <div className="p-2 border rounded bg-white">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay`}
              alt="QR"
              className="w-40 h-40"
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2">
          <Button className="w-full bg-green-600" onClick={onPaymentSuccess}>
            Simulate Success
          </Button>
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
