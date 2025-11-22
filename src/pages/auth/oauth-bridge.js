import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirectByRole } from "../../utils/redirectByRole";

export default function OAuthBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    async function processOAuth() {
      if (!session?.user?.email) return;

      // Convert Google login → your JWT cookie
      const res = await fetch("/api/auth/oauth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await res.json();

      if (data.ok && data.user) {
        redirectByRole(data.user);
      } else {
        window.location.href = "/";
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
