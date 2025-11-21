import cookie from "cookie";

export default async function handler(req, res) {
  // Allow POST request to trigger logout
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Clear the "token" cookie by setting it to expire immediately
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0), // Expire immediately
    })
  );

  return res.status(200).json({ ok: true, message: "Logged out successfully" });
}