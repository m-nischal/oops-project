// src/scripts/setRole.js
import 'dotenv/config';
import dbConnect from "../lib/dbConnect.js";
import User from "../models/User.js";

async function run() {
  const email = process.argv[2];
  const newRole = (process.argv[3] || "").toUpperCase();
  if (!email || !newRole) {
    console.log("Usage: node src/scripts/setRole.js <email> <ROLE>");
    process.exit(1);
  }
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) {
    console.error("User not found:", email);
    process.exit(2);
  }
  user.role = newRole;
  await user.save();
  console.log(`Updated ${email} -> role: ${newRole}`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });