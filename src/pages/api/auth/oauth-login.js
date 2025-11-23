import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import cookie from "cookie";
import { signToken, getJwtMaxAgeSeconds } from "../../../lib/jwt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  await dbConnect();

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ ok: false, message: "Email missing" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ ok: false, message: "User not found" });
  }

  const token = signToken(user);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getJwtMaxAgeSeconds(),
  };

  res.setHeader("Set-Cookie", cookie.serialize("token", token, cookieOptions));

  return res.status(200).json({
    ok: true,
    token, // <--- ADDED THIS: Send token to client so it can be saved
    user: { id: user._id, role: user.role, email: user.email },
  });
}