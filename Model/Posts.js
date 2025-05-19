const mongoose = require('mongoose')

const postSchema =new  mongoose.Schema({
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    Text:{
        type:String,
    },
    HasImage:{
        type:Boolean,
        default:false
    },
    Image:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Image"
    },
    Likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    Comments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    }],
    Saves:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
},{timestamps:true})

module.exports = mongoose.model('Post',postSchema)