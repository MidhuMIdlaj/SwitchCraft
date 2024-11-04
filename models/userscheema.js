

const mongoose = require('mongoose')
const AccessToken = require('twilio/lib/jwt/AccessToken')

const {Schema} =  mongoose 

  
const userSchema = new Schema ({
    name :{
        type : String,
        required : true
    },
    email :{
        type : String,
        required: true,
        unique : true,
    },
     phone : {
        type : String,
        required: false,
        unique : false,
        sparse : true, 
        default : null
     },
     googleId : {
        type : String,
         unique :false
     }, 
     password :{
        type : String,
        required : false
     },
     isBlocked : {
        type : Boolean,
        default : false
     },
     isAdmin :{
        type : Boolean, 
        default : false
     },
     wallet : {
        type: Number, 
        default : 0,
     },

     transaction:[{
        type:{
          type :String,
          required:  true
        },
         amount : {
          type : Number,
          required : true 
         },
         createdOn : {
          type : Date,
          default :Date.now
         }
     }],
     wishlist: [{
      type: Schema.Types.ObjectId,
      ref: 'Product', 
  }], 
      orderHistory : {
        type: Schema.Types.ObjectId,
        ref : 'order',
      },
      createOn : {
        type : Date,
        default:Date.now,
      },

      referalCode: {
        type : String,
      }, 
      redeemed : {
        type : Boolean,
      }, 
      redeemedUsers :[{
        type : Schema.Types.ObjectId,
        ref :'User',
      }],

      searchHistory : [{
        category :{
            type : Schema.Types.ObjectId,
            ref : 'category',
        },
        brand : {
            type: String,

        },
        searchOn :{
            type: Date,
            default : Date.now
        }
      }]


})

    


const User = mongoose.model('User', userSchema)
module.exports = User;

