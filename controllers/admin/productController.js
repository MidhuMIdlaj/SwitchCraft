const Product = require("../../models/ProductScheema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userscheema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");


const loadProduct = async (req, res) => {
  try {
    if (req.session.admin) {
      const productData = await Product.find({})
        .populate('brand', 'categoryOffer name') 
        .populate('type', 'categoryOffer name');
      const updatedProductData = productData.map(product => {
        const categoryOffer = product.brand?.categoryOffer || 0; 
        const productOffer = product.productOffer || 0;

        const highestOffer = Math.max(categoryOffer, productOffer);

        return {
          ...product.toObject(),
          highestOffer, 
          categoryOffer,
          productOffer,
        };
      });

      res.render("admin/product", {
        productData: updatedProductData,
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("Product page error:", error);
  }
};



const loadAddProduct = async (req, res) => {
  try {
    if (req.session.admin) {
      const categoryData = await Category.find({});
      const types = categoryData.filter((cat) => cat.type === "type");
      const brands = categoryData.filter((cat) => cat.type === "brand");
      res.render("admin/addProduct", {
        types: types,
        brands: brands,
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("addProduct page error", error);
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      productName,
      description,
      price,
      stock,
      productOffer,
      type,
      brand,
      color,
      status,
    } = req.body;

    let errors = [];
    if (!productName) errors.push("Product name is required.");
    if (!description) errors.push("Description is required.");
    if (!price || price <= 0) errors.push("Price must be greater than 0.");
    if (!stock || stock <= 0) errors.push("Stock must be greater than 0.");
    if (!brand) errors.push("Brand must be selected.");
    if (!type) errors.push("Type must be selected.");
    if (!color) errors.push("Color is required.");
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    let imagePaths = [];
    if (req.files) {
      for (const fieldName in req.files) {
        imagePaths.push(`/images/${req.files[fieldName][0].filename}`);
      }
    }

    const newProduct = {
      productName,
      description,
      price,
      stock,
      productOffer: productOffer || 0,
      productImage: imagePaths,
      type,
      brand,
      color,
      status: status || "Available",
      isBlocked: false,
    };

    const product = await Product.create(newProduct);
    res.redirect("/admin/product");
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { id, productName, color, price, stock } = req.body;

    let errors = [];

    if (!productName) {
      errors.push("Product Name is required.");
    }
    if (!color) {
      errors.push("Color is required.");
    }
    if (price <= 0 || !price) {
      errors.push("Price must be greater than zero.");
    }
    if (stock <= 0 || !stock) {
      errors.push("Stock must be greater than zero.");
    }
    if (errors.length > 0) {
      return res.redirect(`/admin/product?errors=${encodeURIComponent(JSON.stringify(errors))}`);
    }
    await Product.updateOne({ _id: id }, { $set: { productName, color, price, stock } });
    res.redirect(`/admin/product?success=Product updated successfully!`);
  } catch (error) {
    console.log("Error from edit_product", error);
    res.redirect(`/admin/product?error=Error updating product.`);
  }
};




/status /;
const toggleProductStatus = async (req, res) => {
  const { productId } = req.params;
  const { isBlocked } = req.body; 
  try {
    await Product.findByIdAndUpdate(productId, { isBlocked: isBlocked });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    res.json({ success: false });
  }
};




const EditImage = async (req, res) => {
  const productId = req.params.id;
  try {
      const product = await Product.findById(productId);
      if (product) {
          res.render('admin/editImage', { 
              productId: productId, 
              productImage1: product.productImage[0],  
              productImage2: product.productImage[1],  
              productImage3: product.productImage[2]   
          });
      } else {
          res.status(404).send('Product not found');
      }
  } catch (error) {
      res.status(500).send('Server error');
  }
};


const handleImageEdit = async (req, res) => {
  const productId = req.params.id;
  const uploadedImages = req.files; 
  try {
    const product = await Product.findById(productId);
    if (uploadedImages.image1) {
      product.productImage[0] = `/images/${uploadedImages.image1[0].filename}`;
    }
    if (uploadedImages.image2) {
      product.productImage[1] = `/images/${uploadedImages.image2[0].filename}`;
    }
    if (uploadedImages.image3) {
      product.productImage[2] = `/images/${uploadedImages.image3[0].filename}`;
    }
    await product.save();
    res.redirect(`/admin/product?success=true`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {
  loadProduct,
  loadAddProduct,
  addProduct,
  updateProduct,
  toggleProductStatus,
  EditImage,
  handleImageEdit
};
