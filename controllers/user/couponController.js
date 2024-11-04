const User = require("../../models/userscheema");
const Coupon = require("../../models/couponSchema");


const loadCoupon = async (req, res) => {
    try {
        if (req.session.userData) {
            const user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });

            const page = parseInt(req.query.page) || 1; // Get current page from query, default to 1
            const limit = 6; // Set the number of coupons per page
            const skip = (page - 1) * limit; // Calculate how many coupons to skip

            const today = new Date();
            let coupon = await Coupon.find();

            // Update coupon status if expired
            await Promise.all(coupon.map(async (coupon) => {
                if (new Date(coupon.expireOn) < today && coupon.isList) {
                    coupon.isList = false;
                    await coupon.save();
                }
            }));

            // Fetch paginated coupons
            const totalCoupons = await Coupon.countDocuments({ isList: true }); // Count available coupons
            const totalPages = Math.ceil(totalCoupons / limit); 

            const paginatedCoupons = await Coupon.find({ isList: true }) // Fetch coupons that are still listed
                .skip(skip)
                .limit(limit);

            res.render('user/coupon', { 
                user, 
                coupon: paginatedCoupons,
                currentPage: page,
                totalPages 
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log('error from user coupon', error);
    }
};


module.exports ={
    loadCoupon
}