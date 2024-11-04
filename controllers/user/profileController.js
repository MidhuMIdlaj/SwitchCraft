const User =  require('../../models/userscheema')
const address = require('../../models/addressSchema')
const mongoose = require('mongoose');


const loadProfile = async (req, res) => {
    try {
        let user;
        if (req.session.userData) {
            user = await User.findOne({ _id: req.session.userData._id, isBlocked: false });
        
            const addresses = await address.findOne({ userId: user._id });
            
            if (user) {
                res.render("user/profile", {
                    user,
                    addresses: addresses ? addresses.address : []
                });
            }
        }else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log('Error loading profile', error);
    }
}



     const postProfile = async (req, res) => {
        const { name, email, phone } = req.body;
        try {
           const updateResult = await User.updateOne(
                { email: email }, 
                { $set: { name: name, phone: phone } } 
            );
            if (updateResult) {
                return res.status(200).json({ success: true, message: 'Profile updated successfully!' });
            } 
             return res.redirect('/user/profile')
        } catch (error) {
            console.error(error, "Error updating user profile");
            res.status(500).json({ success: false, message: 'Error updating profile. Please try again.' });
        }
    }
    

    const loadAddress = async(req,res)=>{
        if(req.session.userData){
            const userId = req.session.userData?._id;
            res.render('user/address', {
                userId
            })
        }else{
            res.redirect('/login'); 
        }
       
    }

    const postAddress = async (req, res) => {
        const { firstName, lastName, houseNumber, area, district, landmark, phoneNumber, pinCode } = req.body;
    
        // Validation
        const errors = [];
    
        if (!firstName || firstName.trim() === '') errors.push('First Name is required.');
        if (!lastName || lastName.trim() === '') errors.push('Last Name is required.');
        if (!houseNumber || houseNumber.trim() === '') errors.push('House Number is required.');
        if (!area || area.trim() === '') errors.push('Area is required.');
        if (!district || district.trim() === '') errors.push('District is required.');
    
        const phonePattern = /^[0-9]{10}$/;
        if (!phoneNumber || !phonePattern.test(phoneNumber)) errors.push('Phone Number must be a valid 10-digit number.');
    
        const pinPattern = /^[0-9]{6}$/;
        if (!pinCode || !pinPattern.test(pinCode)) errors.push('Pin Code must be a valid 6-digit number.');
    
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Validation failed', errors });
        }
    
        try {
            const userId = req.session.userData._id;
    
            const newAddress = { firstName, lastName, houseNumber, area, district, landmark, phoneNumber, pinCode };
            let userAddress = await address.findOne({ userId });
    
            if (!userAddress) {
                userAddress = new address({ userId, address: [newAddress] });
            } else {
                userAddress.address.push(newAddress);
            }
    
            const savedAddress = await userAddress.save();
            return res.status(201).json({ message: 'Address saved successfully', address: savedAddress });
    
        } catch (error) {
            console.log('Address error:', error);
            return res.status(500).json({ message: 'Error saving address' });
        }
    };
        
    

    const updateAddress = async (req, res) => {
        try {
            const {
                addressId,
                firstName,
                lastName,
                houseNumber,
                area,
                landmark,
                district,
                pinCode,
                phoneNumber
            } = req.body;
    
            // Make sure to use the correct path to the addressId in your schema
            const updatedAddress = await address.findOneAndUpdate(
                { "address._id": addressId },
                {
                    $set: {
                        "address.$.firstName": firstName,
                        "address.$.lastName": lastName,
                        "address.$.houseNumber": houseNumber,
                        "address.$.area": area,
                        "address.$.landmark": landmark,
                        "address.$.district": district,
                        "address.$.pinCode": pinCode,
                        "address.$.phoneNumber": phoneNumber
                    }
                },
                { new: true }
            );
    
            if (!updatedAddress) {
                return res.status(404).json({ message: 'Address not found' });
            }
    
            res.status(200).json({ message: 'Address updated successfully' });
    
        } catch (error) {
            console.error("Update error:", error);
            res.status(500).json({ message: 'Error updating address' });
        }
    };
    



    const deleteAddress = async (req, res) => {
        try {
            const addressId = req.params.addressId;
            const userId = req.session.userData._id
            const result = await address.updateOne(
                { userId: userId, 'address._id': addressId },
                { $pull: { address: { _id: addressId } } }
            );
            
            if (result.matchedCount === 0) {
                res.status(404).json({ message: 'Address not found' });
            } else if (result.modifiedCount === 0) {
                res.status(200).json({ message: 'Address not deleted' });
            } else {
                res.status(200).json({ success: true, message: 'Address deleted successfully' });
            }
        } catch (error) {
            console.error('Error deleting address:', error);       
            res.status(500).send({ message: 'Error deleting address' });
        }
    };
    

module.exports ={
    loadProfile,
    postProfile,
    loadAddress,
    postAddress,
    updateAddress,
    deleteAddress,
}
