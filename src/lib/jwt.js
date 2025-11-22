import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(user) {
  return jwt.sign(
    {
      id: String(user._id),
      role: user.role || "CUSTOMER",
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function getJwtMaxAgeSeconds() {
  if (!process.env.JWT_EXPIRES_IN) return 7 * 24 * 60 * 60; // 7 days default

  const v = process.env.JWT_EXPIRES_IN;
  const m = v.match(/^(\d+)([dhm])$/);
  if (m) {
    const amount = Number(m[1]);
    if (m[2] === "d") return amount * 24 * 60 * 60;
    if (m[2] === "h") return amount * 60 * 60;
    if (m[2] === "m") return amount * 60;
  }

  const maybeNum = Number(v);
  if (!isNaN(maybeNum)) return maybeNum;

  return 7 * 24 * 60 * 60;
}
