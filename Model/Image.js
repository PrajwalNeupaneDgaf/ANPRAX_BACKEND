const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    Post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    Link:{
        type:String,
        required:true,
    },
    Id:{
        type:String,
        required:true,
    }
    
    
},{ timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);