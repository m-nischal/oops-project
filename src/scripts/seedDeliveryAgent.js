// src/scripts/seedDeliveryAgent.js
import 'dotenv/config';
import dbConnect from "../lib/dbConnect.js";
import User from "../models/User.js";
import Delivery from "../models/deliveryModel.js";
import bcrypt from "bcryptjs";

function chooseRoleForDelivery(userModel) {
  try {
    const enumVals = userModel.schema.path('role')?.enumValues || [];
    if (enumVals.length === 0) return null;
    // prefer exact DELIVERY
    if (enumVals.includes('DELIVERY')) return 'DELIVERY';
    // prefer any value that looks like delivery/agent
    const prefer = enumVals.find(v => /deliver|agent|driver/i.test(v));
    if (prefer) return prefer;
    // fallback to first enum value
    return enumVals[0];
  } catch (e) {
    return null;
  }
}

async function run() {
  await dbConnect();

  const chosenRole = chooseRoleForDelivery(User);
  if (!chosenRole) {
    console.warn("Unable to determine role enum from User model. Please check src/models/User.js");
  } else if (chosenRole !== 'DELIVERY') {
    console.warn(`User model does not include 'DELIVERY' role. Seed will create user with role='${chosenRole}' instead. If you want 'DELIVERY' exact value, add it to the User model enum.`);
  } else {
    console.log("Using role:", chosenRole);
  }

  // Create delivery agent user if not exists (use chosenRole)
  let email = "agent1@delivery.local";
  let agent = await User.findOne({ email });
  if (!agent) {
    const password = "password123";
    const hashed = await bcrypt.hash(password, 10);
    const createDoc = {
      name: "Delivery Agent 1",
      email,
      phone: "+919900000001",
      role: chosenRole || "CUSTOMER", // fallback
      password: hashed
    };
    agent = await User.create(createDoc);
    console.log("Created delivery agent with password:", "password123", "role:", createDoc.role);
  } else {
    console.log("Delivery agent already exists:", agent._id, "role:", agent.role);
  }

  // Create a test delivery
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const d = await Delivery.create({
    externalOrderId: "SEED-ORD-001",
    fromType: "WHOLESALER",
    toType: "RETAILER",
    pickup: { address: "Wholesaler Park, Block A" },
    dropoff: {
      name: "Retailer Demo",
      phone: "+919800000002",
      email: "retailer+seed@example.local",
      address: "Market Road 1"
    },
    deliveryOtp: otp,
    status: "PENDING",
    notes: "Seeded delivery for testing",
    history: [{ status: "PENDING", note: "Seed created" }]
  });

  console.log("Seeded delivery id:", d._id, "OTP:", otp);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});