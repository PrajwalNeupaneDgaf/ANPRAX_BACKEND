

const express = require('express')
const Auth = require('../MiddleWare/Auth')
const { DeleteAllMessages, sendMessage, GetChatsAll, GetPersonalMessages } = require('../Controller/MessageController')


const Router = express.Router()

Router.delete('/delete-message/:Uid',Auth,DeleteAllMessages)
Router.post('/send-message/:Uid',Auth,sendMessage)
Router.get('/get-message/:Uid',Auth,GetPersonalMessages)
Router.get('/get-chats',Auth,GetChatsAll)






module.exports = Router