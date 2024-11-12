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

        const { brand = '', type = '', searchQuery = '', priceRange = '', sortBy } = req.query;
        const brandFilters = brand ? brand.split(',') : [];
        const typeFilters = type ? type.split(',') : [];

        const filters = {};

        if (brandFilters.length > 0) {
            filters.brand = { $in: brandFilters };
        }

        if (typeFilters.length > 0) {
            filters.type = { $in: typeFilters };
        }

        if (searchQuery.trim()) {
            filters.productName = { $regex: searchQuery.trim(), $options: 'i' };
        }

        if (priceRange) {
            const priceRanges = typeof priceRange === 'string' ? JSON.parse(priceRange) : priceRange;
            const priceFilters = priceRanges.map(range => {
                const [min, max] = range.split('-').map(Number);
                if (!isNaN(min) && !isNaN(max)) {
                    return { price: { $gte: min, $lte: max } };
                }
            }).filter(Boolean); 
        
            if (priceFilters.length > 0) {
                if (Object.keys(filters).length === 0) {
                    filters.$or = priceFilters;
                }
            }
        }
        const brands = await Category.find({ type: 'brand', isListed: true });
        const types = await Category.find({ type: 'type', isListed: true });

        let sortOption = {};
        if (sortBy === 'priceLowToHigh') {
            sortOption = { discountedPrice: 1 };  
        } else if (sortBy === 'priceHighToLow') {
            sortOption = { discountedPrice: -1 }; 
        } else if (sortBy === 'nameAZ') {
            sortOption = { productName: 1 };
        } else if (sortBy === 'nameZA') {
            sortOption = { productName: -1 }; 
        }

        const totalProducts = await Product.countDocuments(filters);
        const products = await Product.find(filters)
            .populate('brand', 'categoryOffer name')
            .populate('type', 'categoryOffer name')
            .skip(skip)
            .limit(limit);

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

        updatedProducts.sort((a, b) => {
            if (sortBy === 'priceLowToHigh') {
                return a.discountedPrice - b.discountedPrice;
            } else if (sortBy === 'priceHighToLow') {
                return b.discountedPrice - a.discountedPrice;
            } else {
                return 0; 
            }
        });

        const totalPages = Math.ceil(totalProducts / limit);
        const error = req.flash('error');

        res.render('user/shop', {
            products: updatedProducts,
            currentPage: page,
            totalPages,
            user,
            brands,
            types,
            priceFilter: priceRange,
            sortBy: sortBy || '',
            searchQuery,
            selectedBrandFilters: brandFilters,
            selectedTypeFilters: typeFilters,
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
              discountedPrice,
            },
            relatedProducts: updatedRelatedProducts,
            user,
            errorMessage: req.session.errorMessage, 
            messages: req.flash()
          });
      
          req.session.errorMessage = null;
    } catch (error) {
        console.error("Shop details error:", error);
        res.status(500).send("Server Error");
    }
};

      
     module.exports ={
        loadShop,
        shopDetails
    }