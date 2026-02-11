// backend/testMongo.js
const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://Nandu:Nandu%402005@cluster0.oeix4b2.mongodb.net/codeTranslatorDB?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

testConnection();
