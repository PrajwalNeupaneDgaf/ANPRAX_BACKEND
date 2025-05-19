const Notification = require("../Model/Notification")
const User = require("../Model/User")

const MarkRead = async (req, res) => {
    try {
        const { notificationId } = req.params

        await Notification.findOneAndUpdate(
            { _id: notificationId },
            { $set: { Isread: true } },
        );

        return res.status(200).json({ message: "read done" })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const GetAll = async (req, res) => {
    try {

        const data = await Notification.find({
            To: req.user.id
        }).populate({
            path: "By",
            select: "Name UserName _id Profile"
        }).sort({
            updatedAt: -1
        })
        return res.status(200).json({ message: "read done", data: data })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const MarkAllAsRead = async (req, res) => {
    try {
        const id = req.user.id
        await Notification.updateMany({
            To: id,
            Isread: false
        }, { $set: { Isread: true } })


        return res.status(200).json({ message: "read done" })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

module.exports = {
    MarkRead,
    MarkAllAsRead,
    GetAll
}