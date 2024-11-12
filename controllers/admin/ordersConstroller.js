const Order = require('../../models/orderSchema');
const User = require('../../models/userscheema'); // Assuming you have a User model

    const loadOrders = async (req, res) => {
        try {
            if (req.session.admin) {
                const orders = await Order.find()
                    .populate('userId', 'name') 
                    .populate('orderedItem.product', 'productName').sort({ createdOn: 1})
                res.render('admin/orders', { orders });
            } else {
                res.redirect('/admin/login');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            res.status(500).send('Server error');
        }
    };


const postOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot change status of an order that is already ${order.status}.` 
            });
        }
        if (status !== 'Delivered' && status !== 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status change. Only "Delivered" or "Cancelled" is allowed.' 
            });
        }
        if(order.paymentMethod == "Razorpay"  &&  order.status == "pending"){
            const user = await User.findById(order.userId)
            
             let totalPriceDisplay = order.totalPrice;
            
            if (order.coupon.name) {
             totalPriceDisplay = order.totalPrice - (order.totalPrice * order.coupon.offer / 100) + 50;
             } else {
                let hasOffer = false;
             order.orderedItem.forEach(item => { 
                     if (item.productId && item.price !== item.productId.price) {
                        hasOffer = true;
                        totalPriceDisplay = order.finalAmount + 50;
                     } 
             });
            } 
            user.wallet += totalPriceDisplay     
            user.transaction.push({
              type: "order Canceled Amount",
              amount :  order.finalAmount,
            })
            await user.save()
          }  
        order.status = status;
        await order.save();

        res.json({ success: true, message: 'Order status updated successfully.' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


     
     
module.exports = {
    loadOrders,
    postOrder
};
