const mongoose = require('mongoose')

const newMessage = new mongoose.Schema({
    Sender:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    Receiver:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    DeletedBy:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    Message:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

module.exports = mongoose.model("Message",newMessage)