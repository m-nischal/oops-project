// lib/authHelpers.js
import jwt from "jsonwebtoken";
import dbConnect from "./dbConnect";
import User from "../models/User"; // adjust path if needed

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").map(c => c.trim()).filter(Boolean).reduce((acc, pair) => {
    const [k, ...v] = pair.split("=");
    acc[k] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
}

/**
 * getSessionFromReq tries several common methods:
 * - Authorization: Bearer <token>
 * - cookie named "token"
 * Returns { user, tokenPayload } or null
 */
export async function getSessionFromReq(req) {
  await dbConnect();

  const authHeader = req.headers?.authorization || "";
  const bearer = authHeader.split(" ")[0] === "Bearer" ? authHeader.split(" ")[1] : null;

  const cookies = parseCookies(req.headers?.cookie || "");
  const cookieToken = cookies.token || cookies.jwt || cookies.authToken;

  const token = bearer || cookieToken;
  if (!token) return null;

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.warn("JWT_SECRET not set; getSessionFromReq cannot verify tokens securely.");
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // your login signs { id, role, email }
    const userId = payload.id || payload.userId || payload.sub;
    if (!userId) return null;
    const user = await User.findById(userId).lean();
    if (!user) return null;
    // remove sensitive props
    if (user.password) delete user.password;
    return { user, tokenPayload: payload };
  } catch (err) {
    // invalid token
    return null;
  }
}