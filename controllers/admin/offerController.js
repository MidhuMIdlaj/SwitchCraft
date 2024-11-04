
const Category = require('../../models/categorySchema'); 
const Product = require('../../models/ProductScheema'); 



const loadOffer = async (req, res) => {
    try {
        if (req.session.admin) {
            const brandsWithOffer = await Category.find({ categoryOffer: { $gt: 0 } });
            const productsWithOffer = await Product.find({ productOffer: { $gt: 0 } });
            res.render('admin/offers', {
                brands: brandsWithOffer,
                products: productsWithOffer
            });
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.log('Error from loadOffer:', error);
        res.status(500).send('Internal server error');
    }
};



const addOffer = async (req, res) => {
    try {
        const { type, id } = req.params;
        const { percentage } = req.body;
        if (type === 'brand') {
            await Category.findByIdAndUpdate(id, { categoryOffer: percentage });
        } else if (type === 'product') {
            await Product.findByIdAndUpdate(id, { productOffer: percentage });
        }
        res.status(200).json({ message: 'Offer added successfully' });
    } catch (error) {
        console.log('Error adding offer:', error);
        res.status(500).json({ error: 'Failed to add offer' });
    }
};



const removeOffer = async (req, res) => {
    try {
        const { type, id } = req.params;
        if (type === 'brand') {
            await Category.findByIdAndUpdate(id, { categoryOffer: 0 });
        } else if (type === 'product') {
            await Product.findByIdAndUpdate(id, { productOffer: 0 });
        }
        res.status(200).json({ message: 'Offer removed successfully' });
    } catch (error) {
        console.error('Error removing offer:', error);
        res.status(500).json({ error: 'Failed to remove offer' });
    }
}


const fetchItemsWithoutOffers = async (req, res) => {
    try {
        const { type } = req.params;
        let items;
        if (type === 'product') {
            items = await Product.find({ productOffer: { $eq: 0 } }); 
        } else if (type === 'brand') {
            items = await Category.find({type:{$eq:'brand'}, categoryOffer: { $eq: 0 } }); 
        } else {
            return res.status(400).json({ error: 'Invalid type parameter' });
        }
        res.status(200).json(items);
    } catch (error) {
        console.log('Error fetching items without offers:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
};




module.exports ={
    loadOffer,
    addOffer,
    removeOffer,
    fetchItemsWithoutOffers
}
