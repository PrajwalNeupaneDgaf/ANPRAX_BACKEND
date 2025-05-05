const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
const getReceiverId = (receiverId) => {
    return userSocketMap[receiverId]
}

const userSocketMap = {}

io.on("connection", (socket) => {
    const id = socket.handshake.query.id
    if (id != 'undefined') {

        userSocketMap[id] = socket.id
        console.log("Added")
    }

    socket.on("disconnect", () => {
        delete userSocketMap[id]
        io.emit('getOnlineUsers', Object.keys(userSocketMap))

    });
});

module.exports = { app, server, io, getReceiverId };