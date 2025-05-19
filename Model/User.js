const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    LastText:{
        type:String,
    }
},{timestamps:true})

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
        trim: true,
    },
    UserName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    Password: {
        type: String,
        required: true,
    },
    Gender: {
        type: String,
        enum: ["Male", "Female", "Others"],
        required: true,
    },
    Email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    IsVerified: {
        type: Boolean,
        default: false,
    },
    VerificationCode: {
        type: String,
    },
    Friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    SentRequest: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    ReceivedRequest: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    Status: {
        type: String,
        enum: ['Private', 'Public'],
        default: 'Public',
    },
    Posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
    Profile:
    {
        type:String,
       required:true,
        default:"https://static.vecteezy.com/system/resources/previews/021/548/095/original/default-profile-picture-avatar-user-avatar-icon-person-icon-head-icon-profile-picture-icons-default-anonymous-user-male-and-female-businessman-photo-placeholder-social-network-avatar-portrait-free-vector.jpg"
    },
    ProfileId:{
        type:String, 
    },
    Chats: [chatSchema],
    Saves: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
    ID_Status: {
        type: String,
        enum: ['Active', 'Deactivated'],
        default:"Active"
    },
    Blocks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],

}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User
