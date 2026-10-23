require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Project");


const products = [
  ["Tata Salt", "1 kg", 28],
  ["Aashirvaad Atta", "5 kg", 265],
  ["Amul Taaza Milk", "1 L", 68],
  ["Amul Butter", "500 g", 285],
  ["Fortune Sunflower Oil", "1 L", 155],
  ["Maggi 2-Minute Noodles", "280 g", 56],
  ["Tata Tea Gold", "500 g", 285],
  ["Britannia Good Day", "250 g", 40],
  ["Parle-G Biscuits", "800 g", 80],
  ["Daawat Basmati Rice", "5 kg", 640],
  ["Toor Dal", "1 kg", 165],
  ["Sugar", "1 kg", 48],
  ["Red Label Tea", "500 g", 255],
  ["Nescafe Classic", "100 g", 330],
  ["Amul Cheese Slices", "200 g", 135],
  ["Mother Dairy Curd", "400 g", 40],
  ["Eggs", "12 pcs", 84],
  ["Haldiram Bhujia", "400 g", 120],
  ["Kissan Tomato Ketchup", "950 g", 150],
  ["Dettol Handwash", "200 ml", 99],
  ["Surf Excel Easy Wash", "1 kg", 135],
  ["Colgate Strong Teeth", "200 g", 110],
  ["Lays Classic Salted", "52 g", 20],
  ["Coca-Cola", "2 L", 95],
  ["Bournvita", "500 g", 255],
  ["Kellogg’s Corn Flakes", "875 g", 380],
  ["Saffola Gold Oil", "1 L", 190],
  ["Everest Garam Masala", "100 g", 88],
  ["MDH Chana Masala", "100 g", 82],
  ["Onion", "1 kg", 40],
];

const seedProducts = async () => {
  try {
    await connectDB();

    const operations = products.map((product, index) => ({
      updateOne: {
        filter: {
          productId: index,
        },

        update: {
          $set: {
            productId: index,
            name: product[0],
            quantity: product[1],
            basePrice: product[2],
            isActive: true,
          },
        },

        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations);

    console.log("Products seeded successfully!");
    console.log(`Total products: ${products.length}`);
    console.log(`Inserted: ${result.upsertedCount}`);
    console.log(`Updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Product seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedProducts();