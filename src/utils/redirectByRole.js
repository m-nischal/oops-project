// utils/redirectByRole.js (helper)
export async function redirectIfLoggedIn(ctxOrClientSide) {
  // client-side example:
  const token = localStorage.getItem("token");
  if (!token) return;
  // optionally decode token to get role
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = payload.role;
    if (role === "RETAILER") location.replace("/retailer/dashboard");
    else if (role === "WHOLESALER") location.replace("/wholesaler/dashboard");
    else location.replace("/customer/home");
  } catch (err) {
    // fallback: call /api/auth/me to get fresh data
  }
}
