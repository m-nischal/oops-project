import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirectByRole } from "../../utils/redirectByRole";

export default function OAuthBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    async function processOAuth() {
      if (!session?.user?.email) return;

      try {
        // Convert Google login → your JWT token
        const res = await fetch("/api/auth/oauth-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: session.user.email }),
        });

        const data = await res.json();

        if (data.ok && data.user) {
          // --- FIX START: Save the token! ---
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          // --- FIX END ---
          
          redirectByRole(data.user);
        } else {
          // If user not found or error, go home
          window.location.href = "/";
        }
      } catch (e) {
        console.error("OAuth Error", e);
        window.location.href = "/login";
      }
    }

    if (status === "authenticated") processOAuth();
  }, [session, status]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p>Signing you in...</p>
    </div>
  );
}