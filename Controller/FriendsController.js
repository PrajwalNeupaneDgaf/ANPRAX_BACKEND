const User = require("../Model/User")
const { io, getReceiverId } = require("../Utils")

const SendRequest = async (req, res) => {
    try {
        const { Uid } = req.params
        const id = req.user.id

        const me = await User.findById(id)
        const Receiver = await User.findById(Uid)

        if (!Receiver) throw new Error("Sorry User Not Found")

        if (me?.SentRequest?.find(itm => itm.toString() == Uid)) {
            throw new Error("Request Already Sent")
        }

        if (me?.Blocks?.find(itm => itm.toString() === Uid)) {
            throw new Error("You Blocked This User")
        }
        if (Receiver?.Blocks?.find(itm => itm.toString() === id)) {
            throw new Error("You are Blocked by This User")
        }

        if (me?.ReceivedRequest?.find(itm => itm.toString() == Uid)) {
            throw new Error("Request Has Been Received")
        }
        if (me?.Friends?.find(itm => itm.toString() == Uid)) {
            throw new Error("Already a Friends")
        }

        me.SentRequest.push(Uid)
        Receiver.ReceivedRequest.push(id)


        await me.save()
        await Receiver.save()

        const SocketId = getReceiverId(Uid)

        io.to(SocketId).emit("Request:Received", { me })

        return res.status(200).json({
            message: "Request Send SuccessFully"
        })



    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const CancelRequest = async (req, res) => {
    try {

        const { Uid } = req.params
        const id = req.user.id

        const me = await User.findById(id)
        const Receiver = await User.findById(Uid)

        if (!Receiver) throw new Error("Sorry User Not Found")

        me.SentRequest = me?.SentRequest?.filter((itm) => itm.toString() !== Uid)
        Receiver.ReceivedRequest = Receiver?.ReceivedRequest?.filter(itm => itm.toString() !== id)

        await me.save()
        await Receiver.save()

        return res.status(200).json({
            message: "Request Cancelled"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const ManageRequest = async (req, res) => {
    try {
        const { Uid } = req.params
        const { isAccepted } = req.body
        const id = req.user.id

        const me = await User.findById(id)
        const Sender = await User.findById(Uid).select("-password")

        if (!Sender) throw new Error("Sorry User Not Found")

        if (me?.Blocks?.find(itm => itm.toString() === Uid)) {
            throw new Error("You Blocked This User")
        }
        if (Sender?.Blocks?.find(itm => itm.toString() === id)) {
            throw new Error("You are Blocked by This User")
        }



        if (isAccepted) {
            if (me?.ReceivedRequest?.find(itm => itm.toString() == Uid)) {
                me.Friends.push(Uid)
                Sender.Friends.push(id)
                me.ReceivedRequest = me?.ReceivedRequest?.filter(itm => itm.toString() !== Uid)
                Sender.SentRequest = Sender?.SentRequest?.filter(itm => itm.toString() !== id)
                await me.save()
                await Sender.save()
                const userSocketId = getReceiverId(Uid)
                io.to(userSocketId).emit("Request:Accepted", { User: me })
            }

        } else {
            me.ReceivedRequest = me?.ReceivedRequest?.filter((itm) => itm.toString() !== Uid)
            Sender.SentRequest = Sender?.SentRequest?.filter(itm => itm.toString() !== id)
            await me.save()
            await Sender.save()
        }

        return res.status(200).json({
            message: `Request ${isAccepted ? "Accepted" : "Declined"}`,
            data: isAccepted ? Sender : ""
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const Block = async (req, res) => {
    try {
        const { Uid } = req.params
        const id = req.user.id

        const me = await User.findById(id)
        const user = await User.findById(Uid)

        if (!user) throw new Error("Sorry User Not Found")

        if (me?.Blocks?.some(itm => itm.toString() == Uid)) {
            throw new Error("User Already Blocked")
        }

        me.Friends = me.Friends.filter(itm=>itm.toString()!==Uid)
        user.Friends = user.Friends.filter(itm=>itm.toString()!==id)

        me.Blocks.push(Uid)

        await me.save()
        await user.save()

        return res.status(200).json({
            message: "Blocked User"
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const Unblock = async (req, res) => {
    try {
        const { Uid } = req.params
        const id = req.user.id

        const me = await User.findById(id)
        const user = await User.findById(Uid)

        if (!user) throw new Error("Sorry User Not Found")

        me.Blocks = me?.Blocks.filter(itm => itm.toString() !== Uid)

        await me.save()

        return res.status(200).json({
            message: "User UnBlocked"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const FindFriends = async (req, res) => {
    try {
        const { query } = req.body
        const id = req.user.id


        const Users = await User.find({
            $or: [
                { Name: { $regex: query, $options: 'i' } },
                { UserName: { $regex: query, $options: 'i' } }
            ]
        });

        return res.status(200).json({
            data: Users
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const Unfriend = async (req, res) => {
    try {
        const { Uid } = req.params
        const id = req.user.id

        const me = await User.findById(id)
        const user = await User.findById(Uid)

        if (!user) throw new Error("Sorry User Not Found")

        me.Friends = me?.Friends.filter(itm=>itm.toString()!==Uid)
        user.Friends = user?.Friends.filter(itm=>itm.toString()!==id)

        await me.save()
        await user.save()

        return res.status(200).json({
            message:"Unfriend Succesfull"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}


module.exports = {
    FindFriends,
    SendRequest,
    CancelRequest,
    ManageRequest,
    Block,
    Unblock,
    Unfriend
}