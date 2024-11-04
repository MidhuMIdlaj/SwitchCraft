const category = require('../../models/categorySchema');
const mongoose = require('mongoose');


const categoryLoad = async (req, res) => {
    try {
        if(req.session.admin){
        const categoryData = await category.find({});
        const types = categoryData.filter(cat => cat.type === 'type');
        const brands = categoryData.filter(cat => cat.type === 'brand');

        res.render("admin/category", {
            types: types,
            brands: brands
        });
    }else{
        res.redirect('/admin/login')
    }
    } catch (error) {
        console.log('category error', error);
        res.redirect('/dashboard');
    }
};


const addCategory = async (req, res) => {
    const { name, type } = req.body;
    console.log('Received data:', { name, type });

    try {
        const existingCategory = await category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists!' });
        }

        const newCategory = new category({
            name: name,
            type: type
        });

        await newCategory.save();
        res.json({ message: 'Category added successfully', name, type });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Failed to add category' });
    }
}

     /status category/

const toggleCategoryStatus = async (req, res) => {
    const { categoryId } = req.params;
    const { isListed } = req.body;

    try {
        await category.findByIdAndUpdate(categoryId, { isListed: isListed });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating status:', error);
        res.json({ success: false });
    }
};


/ edit category/
const updateCategory = async (req, res) => {
    const { id, name } = req.body;
     console.log(id,name)
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
    }

    try {
        const updatedCategory = await category.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (updatedCategory) {
            res.json({ message: 'Category updated successfully', updatedCategory });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Failed to update category' });
    }
};


module.exports = {
    categoryLoad,
    addCategory,
    toggleCategoryStatus,
    updateCategory
};
