

const express = require('express')
const { login, register, forgotPassword, me, SendVerificationCode, updatePassword, updateGeneralInfo, addEmail, addPhoto, removeProfile, changePasswordByForgeting, getProfile,  } = require('../Controller/UserController')
const Auth = require('../MiddleWare/Auth')
const { verify } = require('jsonwebtoken')

const Router = express.Router()

Router.post('/login',login)
Router.post('/register',register)
Router.post('/forgot-password',forgotPassword)
Router.get('/me',Auth,me)
Router.get('/get-profile/:id',Auth,getProfile)
Router.get('/send-code',Auth,SendVerificationCode)
Router.get('/verify',Auth,verify)
Router.post('/add-email',Auth,addEmail)
Router.post('/add-photo',Auth,addPhoto)
Router.post('/password-change',Auth,changePasswordByForgeting)
Router.put('/update-password',Auth,updatePassword)
Router.put('/update-general',Auth,updateGeneralInfo)
Router.delete('/remove-profile',Auth,removeProfile)





module.exports = Router