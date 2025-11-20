// src/pages/retailer/products/new.js
import { useEffect } from "react";
import { useRouter } from "next/router";

// This page is now deprecated. Retailers must stock from Wholesalers.
export default function NewProductPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct inventory page for the "Add from Inventory" flow.
    router.replace('/retailer/inventory');
  }, [router]);

  return (
    <div style={{ padding: 20, textAlign: 'center', marginTop: '50px' }}>
      <h1>Access Denied</h1>
      <p>Custom product creation is disabled. Redirecting to Inventory...</p>
    </div>
  );
}