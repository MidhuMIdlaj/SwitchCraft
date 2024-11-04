const Product = require("../../models/ProductScheema");
const User = require("../../models/userscheema");
const Category = require('../../models/categorySchema')


const loadShop = async (req, res) => {
    try {
        let user = null;
        if (req.session.userData) {
            user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const brand = await Category.find({ type: "brand", isListed: true });
        const type = await Category.find({ type: "type", isListed: true });

        let filter = {};
        let selectedCategory = '';
        let selectedType = '';

        if (req.query.category) {
            const category = await Category.findOne({ name: req.query.category });
            if (category) {
                selectedCategory = category.name;
                if (req.query.type === 'brand') {
                    filter.brand = category._id;
                } else if (req.query.type === 'type') {
                    filter.type = category._id;
                }
            }
        }

        // Handle search query
        if (req.query.searchQuery) {
            const searchQuery = req.query.searchQuery.trim();
            filter.productName = { $regex: searchQuery, $options: 'i' };
        }

        // Handle price filtering
        if (req.query.price) {
            const prices = req.query.price;
            if (!Array.isArray(prices)) {
                req.query.price = [prices];
            }
            const priceFilters = [];
            req.query.price.forEach(price => {
                if (price !== 'all') {
                    const [min, max] = price.split('-').map(Number);
                    priceFilters.push({ price: { $gte: min, $lte: max } });
                }
            });
            if (priceFilters.length > 0) {
                filter.$or = priceFilters;
            }
        }

        // Handle sorting options
        let sortOption = {};
        if (req.query.sortBy === 'priceLowToHigh') {
            sortOption = { price: 1 }; 
        } else if (req.query.sortBy === 'priceHighToLow') {
            sortOption = { price: -1 }; 
        } else if (req.query.sortBy === 'nameAZ') {
            sortOption = { productName: 1 }; 
        } else if (req.query.sortBy === 'nameZA') {
            sortOption = { productName: -1 };
        }

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('brand', 'categoryOffer name')
            .populate('type', 'categoryOffer name')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // Apply offer calculations
        const updatedProducts = products.map(product => {
            const productOffer = product.productOffer || 0;
            const brandOffer = product.brand ? product.brand.categoryOffer || 0 : 0;
            const typeOffer = product.type ? product.type.categoryOffer || 0 : 0;
            const highestOffer = Math.max(productOffer, brandOffer, typeOffer);
            const discountedPrice = product.price - (product.price * highestOffer / 100);

            return {
                ...product.toObject(),
                highestOffer,
                discountedPrice
            };
        });

        const totalPages = Math.ceil(totalProducts / limit);
        const error = req.flash('error');

        res.render('user/shop', {
            products: updatedProducts,
            currentPage: page,
            totalPages,
            user,
            brand,
            type,
            sortBy: req.query.sortBy || '', 
            searchQuery: req.query.searchQuery || '',
            selectedCategory,
            selectedType: req.query.type || '',
            noProducts: updatedProducts.length === 0,
            error 
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

  
  const shopDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        let user = null;
        if (req.session.userData) {
            user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
        }

        const product = await Product.findById(productId)
            .populate('brand', 'name categoryOffer')
            .populate('type', 'name categoryOffer'); 

        if (!product) {
            return res.status(404).send("Product not found");
        }
        if (product.isBlocked) {
            req.flash('error', { productId: product._id, message: 'This product is currently unavailable' });
            return res.redirect('/shop');
        }
        
        
        const productOffer = product.productOffer || 0;
        const brandOffer = product.brand ? product.brand.categoryOffer || 0 : 0;
        const typeOffer = product.type ? product.type.categoryOffer || 0 : 0;
        const largestOffer = Math.max(productOffer, brandOffer, typeOffer);
        const discountedPrice = product.price - (product.price * largestOffer / 100); 
        const relatedProducts = await Product.find({
            type: product.type._id,
            _id: { $ne: product._id } 
        }).limit(4);

        const updatedRelatedProducts = relatedProducts.map(relatedProduct => {
            const relatedProductOffer = relatedProduct.productOffer || 0;
            const relatedBrandOffer = relatedProduct.brand ? relatedProduct.brand.categoryOffer || 0 : 0;
            const relatedTypeOffer = relatedProduct.type ? relatedProduct.type.categoryOffer || 0 : 0;
            const relatedHighestOffer = Math.max(relatedProductOffer, relatedBrandOffer, relatedTypeOffer);
            const relatedDiscountedPrice = relatedProduct.price - (relatedProduct.price * relatedHighestOffer / 100);
            
            return {
                ...relatedProduct.toObject(),
                highestOffer: relatedHighestOffer,
                discountedPrice: relatedDiscountedPrice
            };
        });

        res.render('user/shopDetails', {
            product: {
                ...product.toObject(),
                highestOffer: largestOffer,
                discountedPrice
            },
            relatedProducts: updatedRelatedProducts,
            user,
            messages: req.flash()
        });
    } catch (error) {
        console.error("Shop details error:", error);
        res.status(500).send("Server Error");
    }
};

      
     module.exports ={
        loadShop,
        shopDetails
    }