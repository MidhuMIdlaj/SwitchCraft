const Product = require('../../models/ProductScheema')


const getProducts = async (req, res) => {
    try {
        let sortOption = {};

        switch (req.query.sortBy) {
            case 'priceHighToLow':
                sortOption = { price: -1 }; 
                break;
            case 'priceLowToHigh':
                sortOption = { price: 1 };
                break;
            case 'nameAZ':
                sortOption = { productName: 1 }; 
                break;
            case 'nameZA':
                sortOption = { productName: -1 }; 
                break;
            default:
                sortOption = { createdAt: -1 }; 
                break;
        }

        // Fetch and sort products from the database
        const products = await Product.find().sort(sortOption);

        res.json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



module.exports ={
    getProducts
}