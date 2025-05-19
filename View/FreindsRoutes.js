

const express = require('express')
const { SendRequest, CancelRequest, ManageRequest, Block, Unblock, FindFriends, Unfriend } = require('../Controller/FriendsController')
const Auth = require('../MiddleWare/Auth')


const Router = express.Router()

Router.get('/send-request/:Uid',Auth,SendRequest)
Router.get('/cancel-request/:Uid',Auth,CancelRequest)
Router.get('/unfriend/:Uid',Auth,Unfriend)
Router.get('/block-user/:Uid',Auth,Block)
Router.get('/unblock-user/:Uid',Auth,Unblock)
Router.post('/manage-request/:Uid',Auth,ManageRequest)
Router.post('/search',Auth,FindFriends)






module.exports = Router