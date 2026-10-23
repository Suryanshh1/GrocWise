require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
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

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to GrocWise API",
        status: "Server is running"
    });
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