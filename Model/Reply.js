const mongoose = require('mongoose')

const replySchema =new  mongoose.Schema({
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    Text:{
        type:String,
        default:''
    },
    Likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
},{timestamps:true})

module.exports = mongoose.model('Reply',replySchema)