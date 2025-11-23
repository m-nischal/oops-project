import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import RetailerLayout from "@/components/RetailerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ChevronRight,
  MapPin,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Store,
  Phone,
  Mail,
} from "lucide-react";

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STEPS = [
  "ordered",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const getStatusIndex = (status) => {
  if (!status) return 0;
  if (status === "cancelled" || status === "refunded") return -1;
  return STATUS_STEPS.indexOf(status.toLowerCase());
};

const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "delivered")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-sm">
        <CheckCircle className="w-3 h-3 mr-1" /> Delivered
      </Badge>
    );
  if (s === "cancelled")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1 text-sm">
        <XCircle className="w-3 h-3 mr-1" /> Cancelled
      </Badge>
    );
  if (s === "shipped" || s === "out_for_delivery")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 text-sm">
        <Truck className="w-3 h-3 mr-1" /> On the way
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1 text-sm">
      <Clock className="w-3 h-3 mr-1" /> {s.replace(/_/g, " ")}
    </Badge>
  );
};

export default function RetailerOrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [wholesaler, setWholesaler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`/api/orders/${id}`, { headers });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Order not found");

        const data = await res.json();
        const orderData = data.order || data;
        setOrder(orderData);

        // Fetch Wholesaler Details (Seller)
        if (orderData.sellerId) {
          try {
            const userRes = await fetch(
              `/api/public/user/${orderData.sellerId}`
            );
            if (userRes.ok) {
              const userData = await userRes.json();
              setWholesaler(userData);
            }
          } catch (err) {
            console.error(err);
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id, router]);

  if (loading)
    return (
      <RetailerLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </RetailerLayout>
    );
  if (error || !order)
    return (
      <RetailerLayout>
        <div className="max-w-4xl mx-auto p-10 text-center">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5" /> {error || "Order not found"}
          </div>
          <br />
          <Link href="/retailer/purchases">
            <Button variant="outline">Return to History</Button>
          </Link>
        </div>
      </RetailerLayout>
    );

  const currentStepIndex = getStatusIndex(order.status);
  const isCancelled =
    order.status === "cancelled" || order.status === "refunded";

  return (
    <RetailerLayout>
      <div className="max-w-5xl mx-auto pb-10">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/retailer/dashboard" className="hover:text-black">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href="/retailer/purchases" className="hover:text-black">
            Purchases
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="font-semibold text-black">
            #{order._id.slice(-6).toUpperCase()}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Purchase Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Order ID:{" "}
              <span className="font-mono text-black font-medium">
                #{order._id}
              </span>{" "}
              • Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!isCancelled && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-8">
                  <div className="relative flex justify-between items-center">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 -z-0">
                      <div
                        className="h-full bg-black transition-all duration-500"
                        style={{
                          width: `${
                            (Math.max(0, currentStepIndex) /
                              (STATUS_STEPS.length - 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <div
                          key={step}
                          className="flex flex-col items-center gap-2 z-10"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                              isCompleted
                                ? "bg-black border-black text-white"
                                : "bg-white border-gray-200 text-gray-300"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="h-2 w-2 bg-gray-200 rounded-full" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent ? "text-black" : "text-gray-400"
                            }`}
                          >
                            {step.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-lg">Items Purchased</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-6 border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors items-center cursor-pointer group"
                    // UPDATED: Redirects to Wholesale Market Search for this item
                    onClick={() =>
                      router.push(
                        `/retailer/stock?q=${encodeURIComponent(item.name)}`
                      )
                    }
                  >
                    <div className="h-24 w-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="font-bold text-lg">
                          {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Size:{" "}
                        <span className="font-medium text-black">
                          {item.sizeLabel}
                        </span>{" "}
                        | Qty:{" "}
                        <span className="font-medium text-black">
                          {item.qty}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Total:{" "}
                        <span className="font-medium text-black">
                          {formatPrice(item.subtotal)}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/30">
                <CardTitle className="text-lg">Shipping & Payment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-xl h-fit border border-blue-100">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                        Delivery Address
                      </p>
                      <p className="font-bold text-sm text-gray-900">
                        {order.customer?.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {order.customer?.address}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.customer?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-green-50 p-2.5 rounded-xl h-fit border border-green-100">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                        Payment Method
                      </p>
                      <p className="font-bold text-sm text-gray-900">
                        {order.payment?.method || "Cash on Delivery"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.payment?.paidAt ? (
                          <span className="text-green-600 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-medium">
                    {order.shipping > 0 ? formatPrice(order.shipping) : "Free"}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-black text-xl">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Wholesaler Info Card */}
            <Card className="border-gray-200 shadow-sm bg-gray-50">
              <CardContent className="p-5">
                {wholesaler ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                        <Store className="h-6 w-6 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                          Supplier
                        </p>
                        <p className="font-bold text-gray-900 text-base">
                          {wholesaler.name}
                        </p>
                      </div>
                    </div>
                    {(wholesaler.email || wholesaler.phone) && (
                      <>
                        <Separator className="bg-gray-200" />
                        <div className="space-y-2 pt-1">
                          {wholesaler.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />{" "}
                              <span>{wholesaler.phone}</span>
                            </div>
                          )}
                          {wholesaler.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 text-gray-400" />{" "}
                              <span>{wholesaler.email}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                    supplier info...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RetailerLayout>
  );
}
