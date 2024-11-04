const Cart = require("../../models/cartSheema");
const User = require("../../models/userscheema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Product = require('../../models/ProductScheema')
const Razorpay = require("razorpay");
const PDFDocument = require('pdfkit');
const path = require('path');

const createOrder = async (req, res) => {
  try {
      const { coupon, totalPrice, discount } = req.body;
      let finalAmount = totalPrice;
      if (coupon) {
          finalAmount = totalPrice - (totalPrice * (discount / 100));
      }
      const cart = await Cart.findOne({ userId: req.session.userData._id }).populate('items.productId');

      const orderedItems = cart.items.map(item => {
          const itemPrice = item.offerPrice > 0 ? item.offerPrice : item.productId.price;
          return {
              product: item.productId._id,
              quantity: item.quantity,
              price: itemPrice
          };
      });

      const newOrder = new Order({
          userId: req.session.userData._id,
          orderedItem: orderedItems, 
          totalPrice: totalPrice,
          discount: discount,
          finalAmount: finalAmount,
          address: selectedAddress,
          status: 'pending',
          paymentMethod: selectedPaymentMethod,
          coupon: {
              name: coupon ? coupon.name : null,
              offer: coupon ? discount : 0
          }
      });

      await newOrder.save();
      res.redirect('/orders');
  } catch (error) {
      console.log(error);
      res.status(500).send('Server error');
  }
};




const getUserOrders = async (req, res) => {
    try {
        if (req.session.userData) {
            const page = parseInt(req.query.page) || 1;
            const limit = 6;
            const skip = (page - 1) * limit;

            const userId = req.session.userData._id;
            const totalProducts = await Order.countDocuments({ userId });
            const totalPages = Math.ceil(totalProducts / limit);

            // Fetch the paginated orders for the user
            const orders = await Order.find({ userId })
                .populate('orderedItem.product')
                .sort({ createdOn: -1 })
                .skip(skip)
                .limit(limit);

            const user = await User.findOne({ _id: userId, isBlocked: false });

            res.render('user/orders', { 
                orders,
                user,
                currentPage: page,
                totalPages
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Server Error");
    }
};



const orderSuccessPage = async (req,res) =>{
  if(req.session.userData){
    const  orderId = req.session.orderId
    const order = await Order.findById(orderId);
      order.paymentStatus = true;
     await order.save();
      let user = null;
    user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
    req.session.orderId=" "
    res.render('user/order-success',  
      {user}
    )
  }else{
    res.redirect("/login")
  }
}




const cancelOrder = async (req, res) => {
    const { id: orderId } = req.params;
    let userId  =  req.session.userData._id
    try {
        const order = await Order.findById(orderId).populate('orderedItem.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }   
        if (order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Order cannot be canceled' });
        }

        order.status = 'cancelled';
        await order.save();

        for (const item of order.orderedItem) {
            const product = await Product.findById(item.product._id);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

         

        if(order.paymentMethod == "Razorpay" || order.status == "Delivered"){
          const user = await User.findById(userId)
          user.wallet += order.finalAmount     
          
          user.transaction.push({
            type: "order Canceled Amount",
            amount :  order.finalAmount,
          })
          await user.save()
        }
    
         
         
         
        return res.status(200).json({ success: true, message: 'Order canceled and stock updated' });
    } catch (error) {
        console.error('Error canceling the order:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};



const getOrderDetailsPage = async (req, res) => { 
  try {
    if(req.session.userData){
        const orderId = req.params.id;
      let user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
      const order = await Order.findById(orderId)
          .populate({
              path: 'orderedItem.product',
              model: 'Product',
          })
      if (!order) {
          return res.status(404).send('Order not found');
      }
      if (order.paymentStatus.name === false) {
          res.render('user/order-canceled', { order, user });
      } else if (order.status === 'failed') {
          res.render('user/payment-failed', { order, user });
      } else {
          res.render('user/orderDetails', { order, user });
      }
    } else{
        res.redirect("/login")
    }
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
};


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,   
    key_secret: process.env.RAZORPAY_KEY_SECRET 
});

const retryPayment = async (req, res) => {
  try {
      const { orderId } = req.body;
      const order = await Order.findById(orderId);

      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Logic to initiate payment retry
      const razorpayOrderOptions = {
          amount: order.finalAmount * 100,
          currency: "INR",
          receipt: `order_${order._id}`
      };

      const razorpayOrder = await razorpayInstance.orders.create(razorpayOrderOptions);
      return res.status(200).json({
          success: true,
          orderId: razorpayOrder.id,
          razorpayKey: process.env.RAZORPAY_KEY_ID,
      });
  } catch (error) {
      console.error("Error retrying payment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
  }
};




    // RETURN  FUNCTION//
    const returnPayment =  async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findByIdAndUpdate(orderId, { status: 'returned' }, { new: true });
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }   
            res.status(200).json({ message: "Return request successful" });
        } catch (error) {
            console.error("Error updating order:", error);
            res.status(500).json({ message: "Failed to process return request" });
        }
    }
    

    const generateInvoicePDF = async (req, res) => {
        const { orderId } = req.params;

        try {
            let  order = await Order.findById(orderId)
                .populate('userId')        
                .populate('orderedItem.product', 'productName') 
            if (!order) {
                return res.status(404).send("Order not found");
            }
            const doc = new PDFDocument({ margin: 50 });

            res.setHeader('Content-disposition', `attachment; filename=invoice_${order.orderId}.pdf`);
            res.setHeader('Content-type', 'application/pdf');
    
            doc.pipe(res);
    
         
            doc.fontSize(20).text('Invoice', { align: 'center' }).moveDown(1);
    
        
            doc.fontSize(12).text(`Order ID: ${order.orderId}`);
            doc.text(`Date: ${order.createdOn.toDateString()}`);
            doc.text(`Status: ${order.status}`).moveDown();
    
       
            doc.fontSize(15).text('Customer Information', { underline: true }).moveDown(0.5);
            doc.fontSize(12).text(`Customer Name: ${order.userId.name}`);
            doc.text(`Address:  ${order.address.area} ${order.address.district}`);
            doc.text(`Postal Code: ${order.address.pinCode}`);
            doc.text(`Phone: ${order.address.phoneNumber}`).moveDown();
            doc.fontSize(15).text('Order Details', { underline: true }).moveDown(0.5);
            let totalAmount = 0;
            order.orderedItem.forEach(item => {
                const itemTotal = item.price * item.quantity;
                totalAmount += itemTotal;
                doc.fontSize(12)
                    .text(`Product: ${item.product.productName}`)
                    .text(`Quantity: ${item.quantity}`)
                    .text(`Price per Unit: ${item.price.toFixed(2)}`)
                    .text(`Total: ${itemTotal.toFixed(2)}`, { align: 'right' })
                    .moveDown(0.5);
            });
    
    
            doc.moveDown(1).fontSize(15).text('Summary', { underline: true }).moveDown(0.5);
            doc.fontSize(12)
                .text(`Subtotal: ${totalAmount.toFixed(2)}`, { align: 'right' });
    
            if (order.coupon && order.coupon.discount) {
                doc.text(`Discount (${order.coupon.code}): -${order.discount.toFixed(2)}`, { align: 'right' });
            }
            const deliveryCharge = 50
            doc.text(`Delivery Charge: ${deliveryCharge.toFixed(2)}`, { align: 'right' });
            doc.text(`Discount: ${order.discount.toFixed(2)}`, { align: 'right' });
            doc.moveDown(1).fontSize(15).text('', { underline: true }).moveDown(0.5);
            doc.text(`Total Amount: ${order.finalAmount.toFixed(2)}`, { align: 'right' });
    
            doc.moveDown(2).fontSize(12).text('Thank you for shopping with us!', { align: 'center' });
            doc.end();
        } catch (error) {
            console.error("Error generating invoice PDF:", error);
            res.status(500).send("Internal Server Error");
        }
    };




   

   

module.exports ={
    getUserOrders,
    orderSuccessPage,
    cancelOrder,
    getOrderDetailsPage,
    createOrder,
    retryPayment,
    returnPayment,
    generateInvoicePDF,
}
