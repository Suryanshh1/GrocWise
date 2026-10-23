const express = require("express");
const router = express.Router();

const Product = require("../models/Project");

// Emit an event to all connected clients
const emitProductsUpdated = (req) => {
    const io = req.app.get("io");

    if (io) {
        io.emit("productsUpdated");
    }
};

// GET all active products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
});

// GET product by ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findOne({
            productId: Number(req.params.id),
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message
        });
    }
});

// ADD product
router.post("/", async (req, res) => {
    try {
        const {
            productId,
            name,
            quantity,
            basePrice,
            category
        } = req.body;

        if (
            productId === undefined ||
            !name ||
            !quantity ||
            basePrice === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "productId, name, quantity and basePrice are required"
            });
        }

        const existingProduct = await Product.findOne({ productId });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product ID already exists"
            });
        }

        const product = await Product.create({
            productId: Number(productId),
            name,
            quantity,
            basePrice: Number(basePrice),
            category,
            isActive: true
        });

        emitProductsUpdated(req);

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message
        });
    }
});

// UPDATE product
router.put("/:id", async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            {
                productId: Number(req.params.id)
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        emitProductsUpdated(req);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message
        });
    }
});

// DELETE product
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({
            productId: Number(req.params.id)
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        emitProductsUpdated(req);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message
        });
    }
});

module.exports = router;