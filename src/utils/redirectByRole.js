// src/utils/redirectByRole.js
// Client + small helper utilities for role-based redirects.

export function redirectByRole(user) {
  if (!user || !user.role) {
    // fallback homepage
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
      window.location.href = "/customer/home";
      return;
  }
}

/**
 * redirectIfLoggedIn()
 * Client-only helper used on login pages to detect an existing session
 * and immediately redirect the user to their role landing page.
 *
 * Usage in components: call inside useEffect on client:
 *   useEffect(() => { redirectIfLoggedIn(); }, []);
 */
export async function redirectIfLoggedIn() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return; // not logged in
    const data = await res.json();
    if (!data.ok || !data.user) return;
    // redirect based on role
    redirectByRole(data.user);
  } catch (e) {
    // fail silently (no redirect)
    // console.warn("redirectIfLoggedIn error", e);
  }
}