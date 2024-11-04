const Product = require("../../models/ProductScheema");
const Cart = require("../../models/cartSheema");
const User = require("../../models/userscheema")
const Category = require('../../models/categorySchema')

const loadCart = async (req, res) => {
  try {
    if (req.session.userData) {
      const userId = req.session.userData._id;
      const user = await User.findOne({ _id: userId, isBlocked: false });

      if (!user) {
        req.flash('error', 'Your account is blocked. Please contact support.');
        return res.redirect('/login');
      }

      let cart = await Cart.findOne({ userId: userId })
        .populate("items.productId")
        .populate({
          path: 'items.productId',
          populate: {
            path: 'brand type',
            model: 'category'
          }
        });

      if (!cart) {
        cart = new Cart({ userId: userId, items: [] });
        await cart.save();
      }
      const blockedProductIds = [];

      for (let i = cart.items.length - 1; i >= 0; i--) {
        const item = cart.items[i];
        const product = item.productId;
        if (product.isBlocked || product.stock <= 0) {
          req.flash("error", `The product or stock "${product.productName}" is currently unavailable.`);
          blockedProductIds.push(product._id);
          cart.items.splice(i, 1);
        } else {
          const categoryOffer = Math.max(
            product.brand ? product.brand.categoryOffer : 0,
            product.type ? product.type.categoryOffer : 0
          );
          const productOffer = product.productOffer || 0;
          const bestOffer = Math.max(productOffer, categoryOffer);

          const offerPrice = bestOffer > 0 ? product.price - (product.price * bestOffer / 100) : product.price;

          item.offerPrice = offerPrice;
          item.totalPrice = offerPrice * item.quantity;
        }
      }

      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      await cart.save();
      res.render('user/cart', {
        cart: cart,
        user: req.user,
        user,
        messages: req.flash('error')
      });

    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("Error from cart controller: ", error);
  }
};





const addToCart = async (req, res) => {
  try {
    if (!req.session.userData || !req.session.userData._id) {
      return  res.redirect('/login')
    }

    const { productId, price, stock } = req.body;
    const userId = req.session.userData._id;

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({ userId: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      if (existingItem.quantity < stock) {
        existingItem.quantity += 1;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
      } else {
        req.flash("error", "Cannot add more than available stock.");
        return res.redirect(`/shopDetails/${existingItem.productId}`);      
      }
    } else {
      if (stock > 0) {
        cart.items.push({
          productId: productId,
          quantity: 1,
          price: price,
          totalPrice: price,
        });
      } else {
        req.flash("error", "item outOf stock");
        return res.redirect(`/shopDetails/${existingItem.productId}`);      
      }
    }

    cart.calculateTotalPrice();
    req.session.cart = cart;
    await cart.save();

    res.redirect("/cart");
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send("Internal Server Error");
  }
};




const quantityUpdate = async (req, res) => {
  const { productId } = req.params;
  const { change } = req.body;

  const userId = req.session.userData._id;
  let cart = await Cart.findOne({ userId: userId }).populate('items.productId');
  if (!cart || !cart.items) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
  }

  const item = cart.items.find((item) => item.productId._id.toString() === productId);
  if (!item) {
      return res.status(400).json({ success: false, error: "Item not found in cart" });
  }

  const newQuantity = item.quantity + change;
  const product = await Product.findById(productId).populate('brand');
  if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
  }

  const MAX_QUANTITY = 10;
  if (newQuantity > product.stock) {
      return res.status(400).json({ success: false, error: "outOfStock" });
  }

  if (newQuantity > MAX_QUANTITY) {
      return res.status(400).json({ success: false, error: "maxLimitExceeded", message: `You can only purchase up to ${MAX_QUANTITY} units of this product.` });
  }

  if (newQuantity <= 0) {
      return res.status(400).json({ success: false, error: "zeroQuantity" });
  }

  item.quantity = newQuantity;
  let offerPrice = product.price;
  if (product.productOffer > 0) {
      offerPrice = product.price - (product.price * (product.productOffer / 100));
  } else if (product.brand && product.brand.categoryOffer > 0) {
    offerPrice = product.price - (product.price * (product.brand.categoryOffer / 100));
  }
  item.totalPrice = offerPrice * newQuantity;
  cart.totalPrice = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
  await cart.save();
  return res.json({ success: true, price: item.totalPrice });
}





const removeProduct = async (req, res) => {
  try {
      const productId = req.params.productId;
      const user = req.session.userData;

      if (!user || !user._id) {
           res.redirect('/login')
      }
     const result = await Cart.updateOne(
          { userId: user._id },
          { $pull: { items: { productId: productId } } }
      );

      if (result.nModified === 0) {
          return res.json({ success: false, error: 'Failed to remove product from cart' });
      }

      res.json({ success: true, message: 'Product removed successfully', redirectUrl: '/shop' });
  } catch (err) {
      console.error('Error removing product:', err);
      res.json({ success: false, error: 'An error occurred while removing the product' });
  }
};


module.exports = {
  loadCart,
  removeProduct,
  addToCart,
  quantityUpdate,
};
