// src/pages/retailer/products.js
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import RetailerLayout from "../../components/RetailerLayout";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PlusCircle,
  MoreHorizontal,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;

function totalStockFrom(product = {}) {
  if (Array.isArray(product.sizes)) {
    return product.sizes.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  }
  return product.totalStock || 0;
}

export default function RetailerProductsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const router = useRouter();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token"); 
      if (!token)
        throw new Error("No authorization token found. Please log in again.");

      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      };

      // --- FIX: Fetch only PUBLISHED products ---
      const res = await fetch(`/api/retailer/products?status=published&page=${page}&limit=12`, {
        headers: authHeaders,
        cache: "no-store",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch products");
      }
      const data = await res.json();
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;  
    fetchProducts();
  }, [page, isAuthLoading]);

  const handleDeleteProduct = async (productId) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`/api/retailer/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete product");
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };
  
  if (isAuthLoading) {
    return (
      <RetailerLayout>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Verifying access...</p>
        </div>
      </RetailerLayout>
    );
  }
  
  return (
    <RetailerLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Shop (Published)</h1>
        
        {/* --- UPDATED BUTTON: Links to Inventory Page --- */}
        <Link href="/retailer/inventory" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            ADD FROM INVENTORY
          </Button>
        </Link>
      </div>

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

      {/* --- Products Grid --- */}
      {!loading && !error && products.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <ProductDropdownMenu
                    product={product}
                    onDelete={() => handleDeleteProduct(product._id)}
                  />
                </div>
                <CardDescription>{formatPrice(product.price)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[150px] w-full rounded-md bg-gray-100 flex items-center justify-center mb-4">
                  <img
                    src={
                      product.images && product.images[0]
                        ? product.images[0]
                        : "/images/placeholder.png"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover rounded-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || "No description."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-black">
                    {totalStockFrom(product)}
                  </span>
                  <span className="ml-1">Remaining</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No published products. Go to your Inventory to publish items.
            </p>
          </CardContent>
        </Card>
      )}
    </RetailerLayout>
  );
}

function ProductDropdownMenu({ product, onDelete }) {
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/product/${product._id}`} target="_blank">
              View (Public Page)
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/retailer/products/${product._id}/edit`}>Edit & Publish</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              Remove from Shop
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove "{product.name}" from your shop. 
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Yes, remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}