const mongoose = require('mongoose');
const { Schema } = mongoose;

const couponSchema = new Schema({
    name: {
        uppercase: true,
        type: String,
        required: true,
        unique: true
    },
    createOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    expireOn: {
        type: Date,
        required: true,
        index:{expireAfterSeconds:0 }
    },
    OfferPrice: {
        type: Number,
        required: true
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    maximumPrice: {
        type: Number,
        required: true
    },
    isList: {
        type: Boolean,
        default: true
    },
    userIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ] 
});

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
