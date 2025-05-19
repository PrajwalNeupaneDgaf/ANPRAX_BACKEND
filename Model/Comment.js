const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    Text: {
        type: String,
        default: ''
    },
    Likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    Replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply"
    }],
    CommentOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }
}, { timestamps: true })

module.exports = mongoose.model('Comment', commentSchema)