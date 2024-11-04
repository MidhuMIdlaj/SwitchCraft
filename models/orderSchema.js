const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderedItem: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            default: 0,
        },
        productStatus :{
            type :  Boolean,
            default: true ,
        },
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    finalAmount: {
        type: Number,
        required: true,
    },
    address: {
     
        firstName: {
          type: String,
        },
        lastName: {
          type: String,
        },
        houseNumber: {
          type: String,
        },
        area: {
          type: String,
        },
        landmark: {
          type: String,
        },
        pinCode: {
          type: Number,
        },
        phoneNumber: {
          type: Number,
        },
        district: {
          type: String,
        }
      },
    invoiceDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'Delivered', 'cancelled', 'returned'],
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
    coupon: {
        name: {
            type: String,
            default: null,
        },
        offer: {
            type: Number,
            default: null,
        },
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Razorpay', 'COD'],
    },
    paymentStatus: {
      type:  Boolean, 
      default : false
    }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
