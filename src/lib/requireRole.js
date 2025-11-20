// lib/requireRole.js
import { getSessionFromReq } from "./authHelpers";

/**
 * requireRole(role)
 * returns a function that when called with (req,res) returns the user if authorized,
 * otherwise sends 401/403 and returns null.
 *
 * Usage in API routes:
 * const user = await requireRole("DELIVERY")(req, res);
 * if (!user) return; // response already sent
 */
export default function requireRole(role) {
  return async (req, res) => {
    const session = await getSessionFromReq(req);
    if (!session || !session.user) {
      res.status(401).json({ ok: false, error: "Not authenticated" });
      return null;
    }
    const user = session.user;
    if (!user.role || user.role !== role) {
      res.status(403).json({ ok: false, error: "Forbidden: wrong role" });
      return null;
    }
    return user;
  };
}