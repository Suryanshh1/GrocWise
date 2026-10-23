const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productId: {
            type: Number,
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: String,
            required: true,
        },

        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);