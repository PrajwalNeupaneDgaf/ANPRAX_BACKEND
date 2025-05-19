

const express = require('express')
const Auth = require('../MiddleWare/Auth')
const { GetAll, MarkRead, MarkAllAsRead } = require('../Controller/NotificationController')



const Router = express.Router()

Router.get('/get-all',Auth,GetAll)
Router.get('/clicked/:notificationId',Auth,MarkRead)
Router.get('/mark-all-as-read',Auth,MarkAllAsRead)






module.exports = Router