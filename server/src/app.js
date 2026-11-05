require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make Socket.IO available in routes
app.set("io", io);

// Product API
app.use("/api/products", productRoutes);

// Serve static frontend files from the project root
// In production (Render), frontend is in ../../../ (project root relative to server/src/)
const frontendPath = path.join(__dirname, "..", "..", "..");

app.use(express.static(frontendPath, {
    // Don't serve node_modules or server folder
    index: "index.html"
}));

// Catch-all: serve index.html for any unknown route (SPA fallback)
app.get("*", (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ success: false, message: "API route not found" });
    }

    res.sendFile(path.join(frontendPath, "index.html"));
});

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`GrocWise server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();