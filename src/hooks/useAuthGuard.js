// src/hooks/useAuthGuard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * This hook guards a page, ensuring only a user with the
 * expected role can view it.
 *
 * @param {string} expectedRole - The role to check for (e.g., "RETAILER", "WHOLESALER")
 */
export function useAuthGuard(expectedRole) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We can only check localStorage on the client-side
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      // No token, send to login
      alert("Access Denied. Please log in.");
      router.replace('/login');
      return;
    }

    try {
      // Decode the token to get the role
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userRole = payload.role;

      if (userRole === expectedRole) {
        // --- Success ---
        // User has the correct role.
        setIsLoading(false);
      } else {
        // --- Failure ---
        // User is logged in, but with the WRONG role.
        alert(`Access Denied. This page is for ${expectedRole}s, but you are logged in as a ${userRole}.`);
        
        // Redirect them to their *correct* dashboard
        if (userRole === "RETAILER") router.replace('/retailer/dashboard');
        else if (userRole === "WHOLESALER") router.replace('/wholesaler/dashboard');
        else router.replace('/customer/home'); //
      }
    } catch (e) {
      // Token is invalid or malformed
      console.error("Auth guard error:", e);
      localStorage.removeItem("token");
      alert("An error occurred. Please log in again.");
      router.replace('/login');
    }
  }, [expectedRole, router]);

  return { isLoading };
}