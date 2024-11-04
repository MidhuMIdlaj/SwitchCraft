const express = require('express')
const router = express.Router()
const adminAuthController = require('../controllers/admin/adminAuthController')
const {userAuth, adminAuth}= require("../middlewares/auth")
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController'  )
const productController =  require('../controllers/admin/productController')
const orderController = require('../controllers/admin/ordersConstroller')
const couponController = require('../controllers/admin/couponController')
const offersController =  require("../controllers/admin/offerController")
const dashboardController =  require("../controllers/admin/dashboardController")
const {upload}   = require('../helpers/imageCrop')

// admin management router //
router.get('/login',adminAuthController.loadLogin )
router.post('/login',adminAuthController.postLogin)
router.get('/logout',adminAuthController.logout)

// user management router  //
router.get('/users',customerController.customerLoad)
router.get('/blockCustomer',adminAuth, customerController.customerBlock )
router.get('/unblockCustomer',adminAuth, customerController.customerUnBlock )

// category management router  //
router.get('/category',adminAuth,  categoryController.categoryLoad)
router.post('/add-entry', adminAuth, categoryController.addCategory)
router.post('/toggle-category-status/:categoryId', adminAuth,  categoryController.toggleCategoryStatus);
router.post('/update-category',adminAuth,  categoryController.updateCategory);

//  product management  // 
router.get('/product',adminAuth,  productController.loadProduct)
router.get('/addProduct',productController.loadAddProduct)
router.post('/addProduct', upload, productController.addProduct);
router.post('/productEdit'  , productController.updateProduct);
router.post('/toggle-product-status/:productId', productController.toggleProductStatus);
router.get('/editImage/:id',productController.EditImage)
router.post('/editImage/:id', upload, productController.handleImageEdit)



// orders management  //
router.get('/orders', orderController.loadOrders)
router.post('/toggle-order-status/:orderId',orderController.postOrder)


// offers routers //
router.get('/offers', offersController.loadOffer);
router.post('/offers/:type/:id', offersController.addOffer);
router.delete('/offers/:type/:id', offersController.removeOffer);
router.get('/offers/:type/without-offers', offersController.fetchItemsWithoutOffers);


//  coupon routers //
router.get('/coupon', couponController.loadCoupon)
router.post('/add-coupon',couponController.addCoupon); 
router.delete('/delete-coupon/:id', couponController.deleteCoupon);




// dashboard //
router.get('/dashboard',dashboardController.loadDashboard)
router.get('/sales-report/download/pdf',dashboardController.downloadSalesReportPdf);
router.get('/sales-report/download/excel', dashboardController.downloadSalesReportExcel);


module.exports = router