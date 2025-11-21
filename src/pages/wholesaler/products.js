// src/pages/wholesaler/products.js
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import WholesalerLayout from "../../components/WholesalerLayout";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // <--- NEW IMPORTS
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

const PRODUCTS_PER_PAGE = 12;

export default function WholesalerProductsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("WHOLESALER");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Pagination State ---
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const router = useRouter();
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

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

      // Pass the page number to the API
      const res = await fetch(
        `/api/wholesaler/products?page=${page}&limit=${PRODUCTS_PER_PAGE}`,
        {
          headers: authHeaders,
          cache: "no-store",
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
    if (!isAuthLoading) fetchProducts();
  }, [page, isAuthLoading]);

  const handleDeleteProduct = async (productId) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`/api/wholesaler/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete product");
      }

      fetchProducts(); // Refresh list
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // --- Pagination Handler ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isAuthLoading) {
    return (
      <WholesalerLayout>
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </WholesalerLayout>
    );
  }

  return (
    <WholesalerLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Products (Wholesaler)</h1>
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
                  <CardTitle className="text-lg truncate">
                    {product.name}
                  </CardTitle>
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
                  <span className="ml-1">Total Stock</span>
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

      {/* --- Pagination Controls --- */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page - 1);
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page}
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page + 1);
                  }}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-center text-xs text-muted-foreground mt-2">
            Page {page} of {totalPages}
          </div>
        </div>
      )}
    </WholesalerLayout>
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
