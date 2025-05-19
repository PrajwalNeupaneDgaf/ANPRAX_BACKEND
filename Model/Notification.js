const mongoose = require('mongoose')


const notificationSchema = mongoose.Schema({
    Link: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
        required: true,
    },
    To: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    By: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    NotificationType: {
        type: String,
        enum: ["Like", "Comment", "Reply"]
    },
    NotificationOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Post"

    },
    Isread:{
        type:Boolean,
        default:false
    }
}, { timestamps: true })

module.exports = mongoose.model("Notification",notificationSchema)