const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  address: [
    {
      addressType: {
        type: String,
        require: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: false,
      },
      houseNumber: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
        required: true,
      },
      pinCode: {
        type: Number,
        required: true,
      },
      phoneNumber: {
        type: Number,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
    },
  ],
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
