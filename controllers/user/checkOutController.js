const Cart = require("../../models/cartSheema");
const User = require("../../models/userscheema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/ProductScheema");
const Coupon = require("../../models/couponSchema");
const Razorpay = require("razorpay");


const loadCheckOut = async (req, res) => {
  if (req.session.userData) {
    try {
      const userId = req.session.userData._id;
      const user = await User.findById(userId);
      let cart = await Cart.findOne({ userId }).populate("items.productId");

      if (!cart) {
        return res.redirect("/cart");
      }
      let cartTotal = 0;

      for (let item of cart.items) {
        const product = await Product.findById(item.productId._id);

        item.price = product.price;

        const productOffer = product.productOffer || 0;
        const brandOffer = product.brand.categoryOffer || 0;
        const typeOffer = product.type.categoryOffer || 0;
        const highestOffer = Math.max(productOffer, brandOffer, typeOffer);
        
        item.offerPrice = product.price - (product.price * (highestOffer / 100));

        cartTotal += item.totalPrice;
      }
      cart.totalPrice = cartTotal;
      await cart.save();

      const addresses = await Address.findOne({ userId });
      const today = new Date();
      const coupons = await Coupon.find({
        expireOn: { $gte: today },
        isList: true,
        userIds: { $ne: userId },
      });

      res.render("user/checkOut", { user, cart, addresses, coupons });
    } catch (error) {
      console.log("checkOut page error", error);
      res.status(500).send("Server Error");
    }
  } else {
    res.redirect("/login");
  }
};



const loadCheckAddress = async (req, res) => {
  if (req.session.userData) {
    const userId = req.session.userData?._id;   
    res.render("user/checkOutAddress", {
      userId,
    });
  } else {
    res.redirect("/login");
  }
};

const postCheckOutAddress = async (req, res) => {
  const {
    firstName,
    lastName,
    houseNumber,
    area,
    district,
    landmark,
    phoneNumber,
    pinCode,
  } = req.body;

  const userId = req.session.userData._id;

  const newAddress = {
    firstName,
    lastName,
    houseNumber,
    area,
    district,
    landmark,
    phoneNumber,
    pinCode,
  };

  let userAddress = await Address.findOne({ userId });

  if (!userAddress) {
    userAddress = new Address({
      userId,
      address: [newAddress],
    });
  } else {
    userAddress.address.push(newAddress);
  }
  try {
    const savedAddress = await userAddress.save();
    return res
      .status(201)
      .json({ message: "Address saved successfully", address: savedAddress });
  } catch (error) {
    console.log("Address error", error);
    return res.status(500).json({ message: "Error saving address" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.userData._id;
    const coupon = await Coupon.findOne({
      name: couponCode.toUpperCase(),
      isList: true,
    });
    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon." });
    }
    const today = new Date();
    if (coupon.expireOn && coupon.expireOn < today) {
      return res.json({ success: false, message: "Coupon expired." });
    }
    if (coupon.userIds && coupon.userIds.includes(userId)) {
      return res.json({ success: false, message: "Coupon already used." });
    }
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.json({ success: false, message: "Cart not found." });
    }
    let subtotal = 0;
    cart.items.forEach((item) => {
      const itemPrice =  item.offerPrice > 0 ? item.offerPrice : item.productId.price;
      subtotal += itemPrice * item.quantity;
    });
    let discount = 0;
    if (coupon.OfferPrice > 0) {
      discount = (subtotal * coupon.OfferPrice) / 100;
    }
    const discountedSubtotal = Math.max(subtotal - discount, 0);
    const shipping = 50;
    const finalPrice = discountedSubtotal + shipping;
    res.json({ success: true, discount, finalPrice });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


  


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,   
    key_secret: process.env.RAZORPAY_KEY_SECRET 
});


const placeOrder = async (req, res) => {
  try {
      const { selectedAddressId, paymentMethod, couponCode, retryOrderId } = req.body;
      const userId = req.session.userData._id;
      const address = await Address.findOne(
        { "address._id": selectedAddressId },
        { address: 1 }
       );

          const selectedAddress = address.address.find(addr => addr._id.toString() === selectedAddressId);
      
      let cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart) {
          return res.status(400).json({ success: false, message: "Cart not found" });
      } 
      let finalPrice = cart.totalPrice + 50;
      let discount = 0;
      if (couponCode) {
          const coupon = await Coupon.findOne({ name: couponCode.toUpperCase() });
          if (!coupon) {
              return res.status(400).json({ success: false, message: "Invalid coupon." });
          }
          if (coupon.userIds.includes(userId)) {
              return res.status(400).json({ success: false, message: "Coupon already used." });
          }
          if (cart.totalPrice < coupon.minimumPrice || cart.totalPrice > coupon.maximumPrice) {
              return res.status(400).json({ success: false, message: "Cart total does not meet coupon criteria." });
          }
          discount = (cart.totalPrice * coupon.OfferPrice) / 100 
          finalPrice = finalPrice - discount ;
      }

      const orderedItems = cart.items.map((item) => ({
          product: item.productId._id,
          quantity: item.quantity,
          price: item.offerPrice ? item.offerPrice :  item.price,
      }));

      if(paymentMethod == "COD" ){
      if(finalPrice > 1000){ 
        return res.status(400).json({ success: false, message: "Cash on Delivery only for amount below 1000"});
      }
    }
      let order;
      // if (retryOrderId) {
      //     order = await Order.findByIdAndUpdate(retryOrderId, {
      //         userId,
      //         orderedItem: orderedItems,
      //         totalPrice: cart.totalPrice,
      //         discount,
      //         finalAmount: finalPrice,
      //         address: selectedAddressId,
      //         status: "pending",
      //         paymentMethod,
      //         coupon: couponCode ? { name: couponCode, offer: discount } : null,
      //     }, { new: true });
      // } else {

          const newOrder = new Order({
              userId,
              orderedItem: orderedItems,
              totalPrice: cart.totalPrice,
              discount,
              finalAmount: finalPrice,
              address: selectedAddress,
              status: "pending",
              paymentMethod,
              coupon: couponCode ? { name: couponCode, offer: discount } : null,
        })
          order = await newOrder.save();
  
           req.session.orderId = order._id

      for (const item of orderedItems) {
          const product = await Product.findById(item.product);
          if (product && product.isBlocked) {
              return res.status(400).json({ success: false, message: "Product currently unavailable." });
          }
          if (product && product.stock < item.quantity) {
              return res.status(400).json({ success: false, message: "Stock currently unavailable." });
          }
          product.stock -= item.quantity;
          await product.save();
      }
      
      await Cart.deleteOne({ userId });

      if (couponCode) {
          const coupon = await Coupon.findOne({ name: couponCode.toUpperCase() });
          if (coupon) {
              coupon.userIds.push(userId);
              await coupon.save();
          }
      }

      if (paymentMethod === 'Razorpay') {
          const razorpayOrderOptions = {
              amount: finalPrice * 100,
              currency: "INR",
              receipt: `order_${order._id}`
          };
          try {
              const razorpayOrder = await razorpayInstance.orders.create(razorpayOrderOptions);
              return res.status(200).json({
                  success: true,
                  message: "Order created successfully",
                  finalPrice,
                  orderId: razorpayOrder.id,
                  razorpayKey: process.env.RAZORPAY_KEY_ID,
              });
          } catch (error) {
              return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
          }
      } else {
          return res.status(200).json({
              success: true,
              message: "Order placed successfully",
              finalPrice
          });
      }
  } catch (error) {
      console.error("Order submission error:", error);
      return res.status(500).json({ success: false, message: "Server error  " });
  }
};



 const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const isSignatureValid = true; 
  if (isSignatureValid) {
      await Order.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { $set: { "paymentStatus": true} }  
      );
      return res.status(200).json({ success: true });
  } else {
      await Order.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { $set: { "paymentStatus": false } } 
      );
      return res.status(400).json({ success: false });
  }
};



const retryPayment = async (req, res) => {
  try {
    const {orderId} = req.body
    const order = await Order.findById(orderId).populate('orderedItem.product');
    req.session.orderId = order._id
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const razorpayOrderOptions = {
        amount: order.finalAmount * 100, 
        currency: 'INR',
        receipt: `retry_${order._id}`,
    }

    try {
      const razorpayOrder = await razorpayInstance.orders.create(razorpayOrderOptions);
      return res.status(200).json({
          success: true,
          orderId: razorpayOrder.id,
          razorpayKey: process.env.RAZORPAY_KEY_ID,
          amount: order.finalAmount
      });
  } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
  }
} catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({ success: false, message: 'Error retrying payment' });
}
}




module.exports = {
  loadCheckOut,
  placeOrder,
  loadCheckAddress,
  postCheckOutAddress,
  applyCoupon,
  verifyPayment,
  retryPayment,
};
