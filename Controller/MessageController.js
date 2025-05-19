const User = require("../Model/User")
const Message = require("../Model/Message")
const { io, getReceiverId } = require("../Utils")

const sendMessage = async (req, res) => {
    try {
        const id = req.user.id
        const { Uid } = req.params
        const { Text } = req.body

        if (!Text) throw new Error("Message Cant Be Empty")

        const me = await User.findById(id)
        const user = await User.findById(Uid)

        if (!user) throw new Error("Destinated User Not Found")
            

        me.Chats = me.Chats.filter(itm => itm.User.toString()!==Uid)
        user.Chats =user.Chats.filter(itm => itm.User.toString()!==id)
        const newMessage = new Message({
            Sender: id,
            Receiver: Uid,
            Message: Text
        })
        await newMessage.save()
        me.Chats.unshift({
            User:Uid,
            LastText:Text
        })
        user.Chats.unshift({
            User:id,
            LastText:Text
        })
        await me.save()
        await user.save()


        const socketId = getReceiverId(Uid)
        io.to(socketId).emit("New:Message", { newMessage })

        return res.status(200).json({
            message: "Message Sent"
        })



    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const DeleteAllMessages = async (req, res) => {
    try {
        const id = req.user.id
        const { Uid } = req.params

        const me = await User.findById(id)
        const user = await User.findById(Uid)

        if (!user) throw new Error("Destinated User Not Found")

        // 1. Soft delete: Add current user to `deletedBy`
        await Message.updateMany(
            {
                $or: [
                    { Sender: id, Receiver: Uid },
                    { Sender: Uid, Receiver: id }
                ],
                DeletedBy: { $ne: id }
            },
            {
                $push: { DeletedBy: id }
            }
        );

        // 2. Hard delete: Remove messages if both have deleted
        await Message.deleteMany({
            $and: [
                { DeletedBy: { $all: [id, Uid] } },
                {
                    $or: [
                        { Sender: id, Receiver: Uid },
                        { Sender: Uid, Receiver: id }
                    ]
                }
            ]
        });


        me.Chats = me?.Chats.filter(itm => itm.User?.toString() !== Uid)

        await me.save()

        return res.status(200).json({
            message: "Message Deleted",
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const GetPersonalMessages = async (req, res) => {
    try {
        const id = req.user.id
        const { Uid } = req.params

        const me = await User.findById(id)
        const user = await User.findById(Uid).select("_id Name UserName Profile")

        if (!user) throw new Error("Destinated User Not Found")

        const allMessages = await Message.find({
            $or: [
                { Sender: id, Receiver: Uid },
                { Sender: Uid, Receiver: id },
            ],
            DeletedBy: { $ne: id }
        })

        const idSocket = getReceiverId(Uid)

        return res.status(200).json({
            messages: allMessages,
            User:user,
            IsActive:idSocket?true:false


        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const GetChatsAll = async (req, res) => {
    try {
        const id = req.user.id
        const chats = await User.findById(id).select("Chats").populate({
            path: "Chats",
            options: {
                sort: { updatedAt: -1 },
            },
               populate:{path:'User',select:"Name _id UserName Profile"}
           
        })

        return res.status(200).json({
            Chats: chats
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

// const CallUser = async (req, res) => {
//     try {
//         const id = req.user.id
//         const { Uid } = req.params

//         const {callData} = req.body

//         const socketId = getReceiverId(Uid)

//         io.to(socketId).emit("Call:Received",{callData})

//         return res.status(200).json({
//             isRinging:socketId?true:false
//         })
//     } catch (error) {
//         return res.status(500).json({
//             message: error.message,
//             error: error
//         })
//     }
// }

module.exports = {
    sendMessage,
    DeleteAllMessages,
    GetChatsAll,
    GetPersonalMessages
}

