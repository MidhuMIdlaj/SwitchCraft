const User = require('../../models/userscheema')
const Wishlist = require('../../models/wishlistScheema')
const Product = require('../../models/ProductScheema')



const loadWishlistPage = async (req, res) => {
    try {
        
        if(req.session.userData){
            const userId = req.session.userData._id;
            const wishlist = await Wishlist.findOne({userId: userId}).populate('products.productId');
            const  user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
            if(!wishlist || wishlist.products.length == 0){
                return res.render('user/wishlist', {user:userId, products: [], message: 'Your Wishlist is Empty'})
            }

            return res.render('user/wishlist', {user: userId, wishlist, products: wishlist.products,user})
        }
        else{
            res.redirect('/login')
        }
        
    } catch (error) {
        console.log('Wishlist not found', error);
        res.status(500).send('Server error');
    }
}


const addWishlist = async (req, res) => {
    try {

        if(req.session.userData){
            const userId = req.session.userData._id;
            const {productId} = req.body
            console.log('dfa', productId)

            const product = await Product.findById(productId)

            if(!product){
                return res.status(404).json({error: 'Product not found'})
            }

            let wishlist = await Wishlist.findOne({userId: userId})
            if(!wishlist){
                wishlist = new Wishlist({userId: userId, products: []})
            }

            const existingProduct = wishlist.products.find(p => p.productId == productId)

            if(existingProduct){
                return res.status(400).json({error: 'Product already exist in Wishlist'})
            }
            else{
                wishlist.products.push({
                    productId: productId
                })
            }

            await wishlist.save()
            return res.status(200).json({message: 'Product Added to Wishlist'})

        }
        else{
            res.redirect('/login')
        }
        
    } catch (error) {
        console.error('Error adding to Wishlist:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

const removeWishlist = async (req, res) => {
    console.log()
    try {
        const {productId} = req.params;
        const userId = req.session.userData._id;

        const wishlist = await Wishlist.findOne({userId: userId});
        if(!wishlist) {
            return res.status(404).json({success: false, message: 'Wishlist not Found'});
        }

        wishlist.products = wishlist.products.filter(p => p.productId != productId);
        await wishlist.save();

        return res.redirect('/wishlist')
    } catch (error) {
        console.log('Error removing from Wishlist:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};




module.exports = {
    loadWishlistPage,
    addWishlist,
    removeWishlist
}