// backend/db.js - IMPROVED VERSION
const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    console.log("🔄 Attempting MongoDB connection...");
    
    if (!MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in .env file!");
      console.error("Check your .env file for MONGO_URI");
      process.exit(1);
    }
    
    console.log("📡 URI type:", MONGO_URI.includes("mongodb+srv://") ? "SRV" : "Standard");
    console.log("🔗 First 100 chars:", MONGO_URI.substring(0, 100));
    
    // Set connection timeout
    mongoose.set('strictQuery', false);
    
    // Connect with timeout and retries
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4 // Use IPv4, skip IPv6
    };
    
    console.log("⏳ Connecting to MongoDB (timeout: 10s)...");
    
    const conn = await mongoose.connect(MONGO_URI, connectionOptions);
    
    console.log("✅ MongoDB connected successfully!");
    console.log("📊 Database:", conn.connection.name);
    console.log("🏠 Host:", conn.connection.host);
    console.log("📈 Ready State:", conn.connection.readyState);
    
    return conn;
    
  } catch (error) {
    console.error("❌ MongoDB connection FAILED!");
    console.error("📛 Error name:", error.name);
    console.error("📋 Error message:", error.message);
    console.error("🔢 Error code:", error.code || "N/A");
    
    // Specific error messages
    if (error.message.includes("IP that isn't whitelisted")) {
      console.error("\n⚠️  IP WHITELIST ERROR!");
      console.error("1. Go to MongoDB Atlas → Security → Network Access");
      console.error("2. Click 'Add IP Address' → 'Add Current IP Address'");
      console.error("3. Wait 2 minutes, then restart server");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("\n⚠️  DNS/NETWORK ERROR!");
      console.error("Your connection string might be wrong.");
      console.error("Expected format: mongodb://username:password@host1:port1,host2:port2/database?...");
    } else if (error.message.includes("Authentication failed")) {
      console.error("\n⚠️  AUTHENTICATION ERROR!");
      console.error("Check username and password in MONGO_URI");
      console.error("Password with @ should be encoded as %40");
    } else if (error.message.includes("timed out")) {
      console.error("\n⚠️  CONNECTION TIMEOUT!");
      console.error("Network might be blocking the connection.");
      console.error("Try: 1. Disable VPN 2. Use mobile hotspot 3. Check firewall");
    }
    
    console.error("\n🔧 Need to see more details? Enable debug logging:");
    console.error("Add this to your .env: DEBUG=mongoose:*");
    
    process.exit(1);
  }
};

module.exports = connectDB;