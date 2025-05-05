const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

module.exports = mongoose.model('Profile', ProfileSchema);