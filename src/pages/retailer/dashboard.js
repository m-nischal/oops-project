// src/pages/retailer/dashboard.js
import React, { useEffect, useState } from 'react';
import RetailerLayout from '../../components/RetailerLayout';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
// Import a chart library like Recharts when you're ready
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Helper to format currency
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

export default function RetailerDashboard() {
  const { isLoading } = useAuthGuard("RETAILER");
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading) return;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // --- THIS IS THE FIX ---
        // 1. Get the token from localStorage
        const token = localStorage.getItem("token"); //
        if (!token) {
          throw new Error("No authorization token found. Please log in again.");
        }

        // 2. Create the authorization headers
        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` //
        };
        // --- END FIX ---
        
        // 3. Use the headers in your fetch calls
        const analyticsRes = await fetch('/api/retailer/analytics', { 
          headers: authHeaders,
          cache: 'no-store'
        });
        if (!analyticsRes.ok) {
           const errData = await analyticsRes.json();
           throw new Error(errData.error || 'Failed to fetch analytics');
        }
        const analyticsData = await analyticsRes.json();
        setStats(analyticsData.stats);
        setGraphData(analyticsData.saleGraph);

        // 4. Use the headers here too
        const ordersRes = await fetch('/api/retailer/orders?limit=5&sort=createdAt:desc', { 
          headers: authHeaders,
          cache: 'no-store'
        });
        if (!ordersRes.ok) {
          const errData = await ordersRes.json();
          throw new Error(errData.error || 'Failed to fetch orders');
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
  }, [isLoading]);
  // --- 5. RENDER LOADING ---
  // Show a blank page or loader while the hook is verifying access.
  if (isLoading) {
    return (
      <RetailerLayout>
        <p>Verifying access...</p>
      </RetailerLayout>
    );
  }
  return (
    <RetailerLayout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {loading && <p>Loading Dashboard...</p>}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <p className="text-xs mt-2">
              If this is an authorization error, please try logging out and logging back in.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* --- Stats Cards (Render only if no error and not loading) --- */}
      {!loading && !error && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalSales)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
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
        </div>
      )}

      {/* --- Sale Graph & Recent Orders (Render only if no error and not loading) --- */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Sale Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full grid place-items-center text-gray-500">
                {/* Add chart component here */}
                [Sale Graph Placeholder]
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map(order => (
                      <TableRow key={order._id}>
                        <TableCell>
                          <div className="font-medium">{order.customer?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            #{order._id.slice(-6)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : 'secondary'}
                            className={
                              order.status === 'delivered' ? 'bg-green-600 text-white' :
                              (order.status === 'cancelled' || order.status === 'refunded' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white')
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
                      <TableCell colSpan="3" className="text-center text-muted-foreground">
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
    </RetailerLayout>
  );
}