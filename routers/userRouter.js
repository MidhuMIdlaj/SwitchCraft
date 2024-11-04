const express = require('express')
const router = express.Router()
const  authController =  require('../controllers/user/authController')
const  userController =  require('../controllers/user/userController')
const shopController = require('../controllers/user/shopeController')
const userProfile =  require("../controllers/user/profileController")
const resetPassword = require('../controllers/user/resetPassword')
const cartController = require('../controllers/user/cartController')
const checkOutController = require('../controllers/user/checkOutController')
const orderController = require('../controllers/user/orderController')
const couponController = require('../controllers/user/couponController')
const walletController = require('../controllers/user/walletController')
const wishlistController = require("../controllers/user/wishlistController")
const retryPaymentController = require("../controllers/user/paymentRetry")
const { Redirect } = require('twilio/lib/twiml/VoiceResponse')
const passport = require('passport')


// home page //
router.get('/pageNotFound', userController.pageNotFound)
router.get('/',userController.loadHomepage)

// user authentication //
router.get('/signup',authController .loadSignup)
router.post('/signup',authController.postSignup)
router.get('/login',authController.loadLogin)
router.post('/login',authController.postLogin)
router.get('/forget_password_email',authController.loadForgotPageLogin)
router.post('/forget_password_email',authController.PostForgetPasswordLogin)
router.get('/otp', authController.loadOtpLOginPage)
router.post('/otp', authController.verifyOtpLogin)
router.get('/changepassword',authController.loadChangePasswordLogin)
router.post('/changepassword',authController.postChangePasswordLogin)
router.get('/passwordSuccess',authController.loadSuccess)
router.post('/otpr', authController.resendOtpLogin)
router.get('/otpsignup', authController.loadOtpSignup)
router.post('/otpsignup', authController.verifyOTPsignup)
router.post('/resendOtp', authController.resendOtpSignup)
router.get('/auth/google', passport.authenticate('google',{scope:["profile","email"]}))
router.get('/auth/google/callback', passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.userData =  req.user
   if(req.session.userData._id){
    res.redirect('/')
   }else {
     res.redirect("/login")
   }
    
});
router.get('/logout' ,authController.logout)




// shop page //
router.get('/shop',shopController.loadShop)
router.get('/shopDetails/:id' ,shopController.shopDetails )




//  user profile //
router.get('/profile', userProfile.loadProfile)
router.post('/profile',userProfile.postProfile )
router.get('/address', userProfile.loadAddress)
router.post('/address', userProfile.postAddress)
router.post('/updateAddress', userProfile.updateAddress)
router.delete('/deleteAddress/:addressId', userProfile.deleteAddress)


// resetPassword //
router.get('/resetPassword', resetPassword.resetPassword)
router.post('/resetPassword', resetPassword.postReset)
router.get('/confirmPassword', resetPassword.changePassword )
router.post('/confirmPassword', resetPassword.postConfirmPassword)



// cart page  // 
router.get('/cart', cartController.loadCart)
router.post('/cart/add', cartController.addToCart);
router.post('/cart/update-quantity/:productId', cartController.quantityUpdate)
router.post('/cart/remove/:productId', cartController.removeProduct )



// checkOut page //
router.get('/checkOut', checkOutController.loadCheckOut)
router.post('/placeOrder', checkOutController.placeOrder)
router.get('/checkOutAddress', checkOutController.loadCheckAddress)
router.post('/checkOutAddress', checkOutController.postCheckOutAddress)
router.post('/verify-payment', checkOutController.verifyPayment);
router.post('/applyCoupon', checkOutController.applyCoupon);
router.post('/retry-payment', checkOutController.retryPayment);


// orders //
router.get('/orders', orderController.getUserOrders);
router.get('/order-success', orderController.orderSuccessPage);
router.post('/orders/cancel/:id', orderController.cancelOrder);
router.get('/orders/:id', orderController.getOrderDetailsPage);
router.post('/orders/:orderId/return',orderController.returnPayment);
router.get('/generateInvoicePDF/:orderId',orderController.generateInvoicePDF);



// coupons //
router.get('/coupon', couponController.loadCoupon)


//  wallet // 
 router.get('/wallet',  walletController.loadWallet)


 // wishlist //
 router.get('/wishlist', wishlistController.loadWishlistPage);
 router.post('/wishlist/add', wishlistController.addWishlist);
 router.get('/wishlist/remove/:productId',wishlistController.removeWishlist)


 router.get("/payment-failure", retryPaymentController.retryPayment)

module.exports = router