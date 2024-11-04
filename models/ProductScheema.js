    const mongoose = require('mongoose');
    const { Schema } = mongoose;

    const productSchema = new Schema({
        productName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        brand: {
            type: Schema.Types.ObjectId,
            ref: 'category',
            required: true,
        },
        type: {
            type: Schema.Types.ObjectId,
            ref: 'category',    
            required: true,
        },
        color:{
            type: String,
            required:  true
        },
        price: {
            type: Number,
            required: true,
        },
        productOffer: {
            type: Number,
            default: 0,
        },
        stock: {
            type: Number,
            default: 0,
        },
        productImage: {
            type: [String],
            default: [], 
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['Available', 'Out of stock', 'Discontinued'],
            required: true,
            default: 'Available',
        },
    }, { timestamps: true });

    const Product = mongoose.model('Product', productSchema);

    module.exports = Product;
    