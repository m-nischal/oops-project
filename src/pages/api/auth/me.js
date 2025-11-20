// pages/api/auth/me.js
import { getSessionFromReq } from "../../../lib/authHelpers";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const { user } = session;
  // remove any sensitive fields (password, tokens)
  if (user.password) delete user.password;
  return res.json({ ok: true, user });
}