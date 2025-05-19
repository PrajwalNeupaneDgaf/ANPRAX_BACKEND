const { default: mongoose } = require("mongoose")
const Comment = require("../Model/Comment")
const Image = require("../Model/Image")
const Notification = require("../Model/Notification")
const Posts = require("../Model/Posts")
const User = require("../Model/User")
const { io, getReceiverId } = require("../Utils")
const cloudinary = require("../Utils/Cloudinary")

const CreatePost = async (req, res) => {
    try {
        const id = req.user.id
        const image = req?.files?.image ?? null;


        const Text = req?.body?.Text || null


        if (!Text && !image) throw new Error("Post Cannot be Completely Empty")

        const user = await User.findById(id)

        let result, imageId

        if (image) {
            result = await cloudinary.uploader.upload(image.tempFilePath, { folder: 'Posts' })
            const newImage = new Image({
                Link: result.url,
                Id: result.public_id
            })
            imageId = newImage._id

            await newImage.save()
        }

        const newPost = new Posts({
            User: id,
            Text: Text,
            HasImage: image ? true : false,
            Image: image ? imageId : null,
        })

        await newPost.save()
        user.Posts.push(newPost._id)
        await user.save()

        return res.status(200).json({
            message: "Posted SuccesFully",
            Post: newPost
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const UpdatePost = async (req, res) => {
    try {
        const id = req.user.id
        const { postId } = req.params
        let image, Text
        if (req.files) {
            image = req.files.image
        }
        if (req.body) {
            Text = req.body.Text
        }

        const { RemoveImage } = req.body

        if (!Text && !image) throw new Error("Post Cannot be Completely Empty")

        const user = await User.findById(id)

        const myPost = await Posts.findById(postId)

        if (myPost.User.toString() !== id) {
            throw new Error("Not Yours Post ")
        }

        const deletePhoto = async (public_Id) => {
            const result = await cloudinary.uploader.destroy(public_Id)

            return result;
        }


        if (image) {
            if (myPost.HasImage) {
                const postImage = await Image.findById(myPost.Image)
                await deletePhoto(postImage.Id)
                await postImage.deleteOne()
            }
            const result = await cloudinary.uploader.upload(image.tempFilePath, { folder: 'Posts' })

            const newImage = new Image({
                Id: result.public_id,
                Link: result.url
            })
            await newImage.save()
            myPost.Image = newImage._id
            myPost.HasImage = true

        } else {
            if (RemoveImage && myPost.HasImage && myPost.Image) {
                const postImage = await Image.findById(myPost.Image)
                if (!myPost.Text) throw new Error("Post Will Be Empty")
                await deletePhoto(postImage.Id)
                await postImage.deleteOne()
                myPost.Image = null
                myPost.HasImage = false
            }
        }


        myPost.Text = Text

        await myPost.save()

        return res.status(200).json({
            message: "Post Updated"
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const DeletePost = async (req, res) => {
    try {
        const id = req.user.id
        const { postId } = req.params

        const user = await User.findById(id)

        const myPost = await Posts.findById(postId)

        if (myPost.User.toString() !== id) {
            throw new Error("Not Yours Post ")
        }

        const deletePhoto = async (public_Id) => {
            const result = await cloudinary.uploader.destroy(public_Id)

            return result;
        }

        if (myPost.HasImage) {
            const postImage = await Image.findById(myPost.Image)
            await deletePhoto(postImage.Id)
            await postImage.deleteOne()
        }

        await myPost.deleteOne()

        user.Posts = user.Posts.filter(itm => itm.toString() !== postId)

        await user.save()

        await Comment.deleteMany({ CommentOf: postId }) // this should be checked chatgpt said it wont work

        return res.status(200).json({
            message: "Deleted Post"
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const GetPostForUpdate = async (req, res) => {
    try {
        const { postId } = req.params

        const myPost = await Posts.findById(postId).populate("Image").populate("User")

        if (myPost.User._id.toString() !== req.user.id) throw new Error("Not Your Post")

        if (!myPost) throw new Error("Post Unavailable")

        return res.status(200).json({
            message: "Post Fetched",
            data: myPost,

        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const GetPost = async (req, res) => {
    try {
        const { postId } = req.params

        const myPost = await Posts.findById(postId).populate({
            path:"Likes",
            select:"_id UserName Name Profile"
        }).populate({
            path: "User",
            select: "UserName Name _id Profile"
        }).populate({
            path: 'Comments',
            populate: {
                path: 'User',
                select: "Name Profile _id UserName"
            }
        }).populate('Image')

        if (!myPost) throw new Error("Post Unavailable")

        return res.status(200).json({
            message: "Post Fetched",
            data: myPost,
            isMinePost: myPost.User._id == req.user.id ? true : false
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const LikeThePost = async (req, res) => {
    try {
        const { postId } = req.params
        const uid = req.user.id

        //this is used for liking and disliking Both ,

        const myPost = await Posts.findById(postId)

        const me = await User.findById(uid)
        const post = await Posts.findOne({ _id: postId, Likes: uid });

        if (post) {
            await Posts.updateOne(
                { _id: postId },
                { $pull: { Likes: uid } }
            );
            // Like removed
        } else {
            await Posts.updateOne(
                { _id: postId },
                { $push: { Likes: uid } }
            );

            let notification = await Notification.findOne({
                NotificationOf: postId,
                NotificationType: "Like"
            })

            console.log(myPost.Likes.length)

            if (notification) {
                notification.By = uid
                notification.Isread = false
                notification.Description = `${me.Name} and ${myPost.Likes.length} other Liked Your Post`
                await notification.save()
            } else {
                let newNotification = new Notification({
                    To: myPost.User,
                    By: uid,
                    Description: me.Name + " Liked Your Post",
                    NotificationOf: postId,
                    NotificationType: "Like",
                    Link: `/post/${myPost._id}`
                })

                await newNotification.save()
            }
            const socketId = getReceiverId(myPost.User)
            io.to(socketId).emit('New:Notification', { data: `${me.Name} Liked Your Post` })
        }


        return res.status(200).json({
            liked: post ? true : false
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const CommentOnPost = async (req, res) => {
    try {
        const { postId } = req.params
        const uid = req.user.id

        const { Text } = req.body

        if(!Text) throw new Error("Comment Cant be Empty")

        const me = await User.findById(uid)

        const myPost = await Posts.findById(postId)

        const newComment = new Comment({
            User: uid,
            Text: Text,
            CommentOf: postId
        })

        await newComment.save()

        myPost.Comments.push(newComment._id)

        await myPost.save()

        let notification = await Notification.findOne({
            NotificationOf: postId,
            NotificationType: "Comment"
        })



        if (notification) {
            notification.By = uid
            notification.Isread = false
            notification.Description = `${me.Name} and ${myPost.Comments.length} other Commented on  Your Post`
            notification.Link = `/post/${myPost._id}`
            await notification.save()
        } else {
            let newNotification = new Notification({
                To: myPost.User,
                By: uid,
                Description: me.Name + " Commented on Your Post",
                NotificationOf: postId,
                NotificationType: "Comment",
                Link: `/post/${myPost._id}#${newComment._id.toString()}`
            })

            await newNotification.save()
        }
        const socketId = getReceiverId(myPost.User)
        io.to(socketId).emit('New:Notification', { data: `${me.Name} Commented on Your Post` })


        return res.status(200).json({
            message: "Comment Posted"
        })



    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const DeleteTheComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params



        const result = await Comment.findOneAndDelete({
            _id: commentId,
            User: req.user.id
        })


        if (!result) {
            throw new Error("Comment can't be deleted or does not exist");
        }

        const myPostUpdate = await Posts.updateOne(
            { _id: postId },
            { $pull: { Comments: commentId } })

        return res.status(200).json({
            message: "Comment Deleted"
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const ManageSavePost = async (req, res) => {
    try {
        const { postId } = req.params
        const uid = req.user.id


        const me = await User.findById(uid)
        const post = await Posts.findOne({ _id: postId, Saves: uid });

        if (post) {
            await Posts.updateOne(
                { _id: postId },
                { $pull: { Saves: uid } }
            );
            me.Saves = me.Saves.filter(itm => itm.toString() !== postId)
        } else {
            await Posts.updateOne(
                { _id: postId },
                { $push: { Saves: uid } }
            );
            me.Saves.push(postId)
        }

        await me.save()

        return res.status(200).json({
            Saved: post ? false : true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}


const getHomePagePosts = async (req, res) => {
    try {
        const uid = req.user.id

        const user = await User.findById(uid)

        const friendsIds = user.Friends || [];

        const allUserId = [...friendsIds, uid]

        const posts = await Posts.find({ User: { $in: allUserId } })
            .limit(30)
            .populate('Image')
            .populate({
                path: 'User',
                select: 'Name UserName Profile',
            })

        return res.status(200).json(posts)

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const GetSavedPost = async(req,res)=>{
    try {
        const uid = req.user.id

        const user = await User.findById(uid).populate({
            path:"Saves",
            populate:{
                path:"User",
                select:"Name UserName _id Profile"
            }
        })

        return res.status(200).json({
            data:user.Saves
        })
    } catch (error) {
         return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}



module.exports = {
    CreatePost,//done
    UpdatePost,//done
    DeleteTheComment,//done
    CommentOnPost,//done
    LikeThePost,
    DeletePost,//done
    ManageSavePost,//done
    GetPostForUpdate,//done
    GetPost,//done
    getHomePagePosts,//done
    GetSavedPost
}