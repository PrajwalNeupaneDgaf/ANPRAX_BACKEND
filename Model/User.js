const mongoose = require('mongoose');

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
        enum: ["Male", "Female", "Other"],
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
    },
    Chats: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
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
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User
