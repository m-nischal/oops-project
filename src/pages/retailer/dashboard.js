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
  Loader2,
  XCircle,
} from "lucide-react";

// --- IMPORT RECHARTS ---
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

// Helper to format 'YYYY-MM' to 'Jan 25'
const formatMonth = (dateStr) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

export default function RetailerDashboard() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  
  const [stats, setStats] = useState(null);
  const [graphData, setGraphData] = useState([]);
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
        
        // 1. Fetch Analytics (Stats + Graph)
        const analyticsRes = await fetch("/api/retailer/analytics", {
          headers: authHeaders,
          cache: 'no-store'
        });
        if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");
        const analyticsData = await analyticsRes.json();
        
        setStats(analyticsData.stats);
        
        // Format graph data for Recharts
        const formattedGraph = (analyticsData.saleGraph || []).map(item => ({
            ...item,
            displayDate: formatMonth(item.month)
        }));
        setGraphData(formattedGraph);
        
        // 2. Fetch Recent Orders
        const ordersRes = await fetch(
          "/api/retailer/orders?limit=5&sort=createdAt:desc",
          { headers: authHeaders, cache: 'no-store' }
        );
        if (!ordersRes.ok) throw new Error("Failed to fetch orders");
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
      <RetailerLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </RetailerLayout>
    );
  }

  return (
    <RetailerLayout>
      <h1 className="text-3xl font-black tracking-tight mb-6">Dashboard</h1>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* --- 1. STATS CARDS --- */}
      {!loading && !error && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalSales)}</div>
              <p className="text-xs text-muted-foreground">Lifetime revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
              <p className="text-xs text-muted-foreground">Processing or Shipped</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">Successfully Delivered</p>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
              <p className="text-xs text-muted-foreground">Returned or Cancelled</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          
          {/* --- 2. SALES GRAPH --- */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[350px] w-full">
                {graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="displayDate" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#888', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#888', fontSize: 12 }} 
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, "Revenue"]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#000000" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorSales)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p>No sales data available yet.</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* --- 3. RECENT ORDERS TABLE --- */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium text-xs">
                           #{order._id.slice(-6).toUpperCase()}
                           <div className="mt-1">
                              <Badge 
                                variant={order.status === 'delivered' ? 'default' : 'secondary'}
                                className={`text-[10px] px-1.5 py-0 h-5 ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 
                                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {order.status}
                              </Badge>
                           </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.customer?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          {formatPrice(order.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="3" className="text-center text-muted-foreground py-8">
                        No recent orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </RetailerLayout>
  );
}