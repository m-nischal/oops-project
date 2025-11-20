// src/scripts/addJoggersSeed.js
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
import Product from "../models/Product.js";

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
  await mongoose.connect(process.env.MONGO_URI);

  const categoryId = "<CATEGORY_ID>"; // paste here

  const products = [
    {
      name: "Street Jogger - Heather Grey (Men)",
      slug: "street-jogger-heather-grey",
      description: "Soft fleece joggers with tapered fit and zip pockets.",
      brand: "LiveMart Basics",
      price: 1299,
      images: ["/images/joggers/street-grey.jpg"],
      sizes: [{size:"S",stock:10},{size:"M",stock:12},{size:"L",stock:8},{size:"XL",stock:6},{size:"XXL",stock:4}],
      sizeChart: { chartName: "Men's Joggers Size Chart",
        data: {
          S:{waist:"28-30",hip:"34-36",inseam:30,thigh:21},
          M:{waist:"31-33",hip:"37-39",inseam:31,thigh:22},
          L:{waist:"34-36",hip:"40-42",inseam:32,thigh:23},
          XL:{waist:"37-39",hip:"43-45",inseam:33,thigh:24},
          XXL:{waist:"40-42",hip:"46-48",inseam:34,thigh:25}
        }
      },
      warehouses:[{name:"Chennai Warehouse",city:"Chennai",state:"Tamil Nadu",pincode:"600001",leadTimeDays:1}],
      primaryCategory: categoryId,
      categories: [categoryId],
      tags: ["joggers","men"]
    },
    // add more objects here...
  ];

  for (const p of products) {
    await Product.create(p);
    console.log("Inserted:", p.name);
  }

  await mongoose.disconnect();
  console.log("Done");
}

main().catch(err => { console.error(err); process.exit(1); });
