// src/pages/wholesaler/dashboard.js
import React, { useEffect, useState } from "react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import WholesalerLayout from "../../components/WholesalerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DollarSign,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Loader2,
  XCircle, 
} from "lucide-react";

// Helper to format currency
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;

export default function WholesalerDashboard() {
  const { isLoading: isAuthLoading } = useAuthGuard("WHOLESALER");
  
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthLoading) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authorization token found.");
        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        
        // Fetch Analytics
        const analyticsRes = await fetch("/api/wholesaler/analytics", {
          headers: authHeaders,
          cache: 'no-store'
        });
        if (!analyticsRes.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const analyticsData = await analyticsRes.json();
        setStats(analyticsData.stats);
        
        // Fetch Recent Orders
        const ordersRes = await fetch(
          "/api/wholesaler/orders?limit=5&sort=createdAt:desc",
          { headers: authHeaders, cache: 'no-store' }
        );
        if (!ordersRes.ok) {
          throw new Error("Failed to fetch orders");
        }
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.items);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthLoading]);

  if (isAuthLoading) {
    return (
      <WholesalerLayout>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Verifying access...</p>
        </div>
      </WholesalerLayout>
    );
  }

  return (
    <WholesalerLayout>
      <h1 className="text-3xl font-bold mb-6">Wholesaler Dashboard</h1>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* --- Stats Cards --- */}
      {!loading && !error && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.totalSales)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Recent Orders Table --- */}
      {!loading && !error && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                           #{order._id.slice(-6)}
                        </TableCell>
                        <TableCell>
                          {order.customer?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              order.status === "delivered"
                                ? "bg-green-600 text-white"
                                : order.status === "cancelled"
                                ? "bg-red-600 text-white"
                                : "bg-gray-500 text-white"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(order.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan="4"
                        className="text-center text-muted-foreground"
                      >
                        No recent orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </WholesalerLayout>
  );
}