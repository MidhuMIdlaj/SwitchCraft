const  mongoose = require('mongoose')

const  {Schema} = mongoose

const categorySchema = new mongoose.Schema({
    name: {
         type:  String,
         required:  true,
         unique: true
    },
    type :{
        type: String,
        required : true
    },
    isListed : {
        type: Boolean,
        default:  true
    },
    categoryOffer : {
        type: Number,
        default : 0,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
const  category = mongoose.model('category',categorySchema)

module.exports =category
 