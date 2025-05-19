

const express = require('express')
const Auth = require('../MiddleWare/Auth')
const { DeletePost, DeleteTheComment, CommentOnPost, CreatePost, UpdatePost, GetPostForUpdate, GetPost, ManageSavePost, getHomePagePosts, LikeThePost, GetSavedPost } = require('../Controller/PostController')


const Router = express.Router()

Router.delete('/delete-post/:postId',Auth,DeletePost)
Router.delete('/delete-comment/:postId/:commentId',Auth,DeleteTheComment)
Router.post('/add-comment/:postId',Auth,CommentOnPost)
Router.post('/create',Auth,CreatePost)
Router.put('/update/:postId',Auth,UpdatePost)
Router.get('/get-for-update/:postId',Auth,GetPostForUpdate)
Router.get('/get/:postId',Auth,GetPost)
Router.get('/manage-save/:postId',Auth,ManageSavePost)
Router.get('/home',Auth,getHomePagePosts)
Router.get('/saves',Auth,GetSavedPost)
Router.get('/manage-liked/:postId',Auth,LikeThePost)









module.exports = Router