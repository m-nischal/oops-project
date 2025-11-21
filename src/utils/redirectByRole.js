// src/utils/redirectByRole.js

export function redirectByRole(user) {
  if (!user || !user.role) {
    window.location.href = "/";
    return;
  }

  const role = String(user.role).toUpperCase();

  switch (role) {
    case "ADMIN":
    case "DISPATCHER":
      window.location.href = "/admin";
      return;
    case "WHOLESALER":
      window.location.href = "/wholesaler/dashboard";
      return;
    case "RETAILER":
      window.location.href = "/retailer/dashboard";
      return;
    case "DELIVERY":
    case "DRIVER":
    case "DELIVER":
      window.location.href = "/delivery/assigned";
      return;
    case "CUSTOMER":
    default:
      // CUSTOMER GOES TO HOME PAGE (localhost:3000)
      window.location.href = "/"; 
      return;
  }
}

// Helper for client-side redirect on protected pages (not login/register anymore)
export async function redirectIfLoggedIn() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return; 
    const data = await res.json();
    if (!data.ok || !data.user) return;
    redirectByRole(data.user);
  } catch (e) {}
}