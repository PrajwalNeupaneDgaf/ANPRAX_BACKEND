const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const cors = require('cors')

const expressfileUpload = require('express-fileupload')

const mongoose = require('mongoose')




const { app, server } = require('./Utils')

app.use(expressfileUpload({
    useTempFiles: true
}))

app.use(cors({
    origin: ['http://localhost:5173', 'http://www.localhost:5173', "https://anpranx.netlify.app/", "https://github.com"],
}));

app.use(express.json())

app.use(express.urlencoded({ extended: true }))


app.get('/awake', async (req, res) => {
    return res.send('i Am Awake')
})


const profileRouter = require('./View/UserRoute')

app.use('/api/user',profileRouter)


mongoose.connect(process.env.URI)
.then(()=>{
    console.log("Connected")
})
.catch((err)=>{
    console.log('error',err.message)
})

server.listen(process.env.PORT, () => {
    console.log('Server is Running on ', process.env.PORT)
})
