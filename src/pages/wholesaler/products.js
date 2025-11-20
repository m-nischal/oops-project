// src/pages/wholesaler/products.js
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import WholesalerLayout from "../../components/WholesalerLayout"; // We can reuse the same layout
import { useAuthGuard } from '../../hooks/useAuthGuard';
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

// Helper to format currency
const formatPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;

// Helper to get total stock
function totalStockFrom(product = {}) {
  if (Array.isArray(product.sizes)) {
    return product.sizes.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  }
  return product.totalStock || 0;
}

export default function WholesalerProductsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("WHOLESALER");
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

      const token = localStorage.getItem("token"); //
      if (!token)
        throw new Error("No authorization token found. Please log in again.");

      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, //
      };

      // --- THIS IS THE CHANGE ---
      const res = await fetch(
        `/api/wholesaler/products?page=${page}&limit=12`,
        {
          headers: authHeaders,
        }
      );

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

  // Delete Product Handler
  const handleDeleteProduct = async (productId) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      // --- THIS IS THE CHANGE ---
      const res = await fetch(`/api/wholesaler/products/${productId}`, {
        // We need to create this API route
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete product");
      }

      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <WholesalerLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Products (Wholesaler)</h1>
        {/* --- THIS IS THE CHANGE --- */}
        <Link href="/wholesaler/products/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            ADD NEW PRODUCT
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
          <AlertDescription>
            {error}
            <p className="text-xs mt-2">
              Make sure you are logged in as a WHOLESALLER.
            </p>
          </AlertDescription>
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
                  {/* --- THIS IS THE CHANGE --- */}
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
                  <span className="ml-1">Remaining Products</span>
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
              No products found. Click "Add New Product" to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </WholesalerLayout>
  );
}

// --- UPDATED: Helper component for the "..." menu ---
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
            {/* View still goes to the public product page */}
            <Link href={`/product/${product._id}`} target="_blank">
              View (Public Page)
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            {/* --- THIS IS THE CHANGE --- */}
            <Link href={`/wholesaler/products/${product._id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* This is the Delete confirmation dialog */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            product "{product.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Yes, delete product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
