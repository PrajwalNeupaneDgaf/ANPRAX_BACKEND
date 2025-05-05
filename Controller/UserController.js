const User = require("../Model/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const nodeMailer = require('nodemailer')

const validator = require('validator')
const cloudinary = require("../Utils/Cloudinary")
const Profile = require("../Model/Profile")

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.SOMETHING,
    },
});



const login = async (req, res) => {
    try {
        const { UserName, Password } = req.body

        if (!UserName || !Password) throw new Error("Please Fill Properly")

        if (Password.length < 8) throw new Error("Password Minimum Length Should Be 8")

        const user = await User.findOne({ UserName: UserName })

        if (!user) throw new Error("User Not Found, Check UserName")

        const isMatch = await bcrypt.compare(Password, user?.Password)

        if (!isMatch) throw new Error("Password Didn't Matched try Again")


        const token = jwt.sign({ id: user?._id }, process.env.JWT_PASSWORD, { expiresIn: '7d' })

        return res.status(200).json({
            User: user,
            Token: token
        })



    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const register = async (req, res) => {
    try {
        const { UserName, Password, Name, Gender } = req.body

        if (!UserName || !Password || !Name || !Gender) throw new Error("Please Fill Properly")

        const isValid = /^[a-zA-Z0-9_]{3,15}$/.test(UserName);

        if (!isValid) {
            throw new Error('Invalid username: must be at least 3 characters and Max 15 and contain only letters, numbers, and underscores');
        }

        const trimmed = UserName.trim();

        // Check for leading/trailing whitespace
        if (UserName !== trimmed) {
            throw new Error('Username must not have leading or trailing spaces');
        }

        if (Password.length < 8) throw new Error("Password Minimum Length Should Be 8")

        const user = await User.findOne({ UserName: UserName })

        if (user) throw new Error("User Found, Change UserName")

        const HashedPassword = await bcrypt.hash(Password, 10)

        const newUser = new User({
            Name: Name,
            UserName: UserName,
            Gender: Gender,
            Password: HashedPassword
        })

        const Token = jwt.sign({ id: newUser._id }, process.env.JWT_PASSWORD, { expiresIn: "7d" })

        return res.status(200).json({
            User: newUser,
            Token: Token
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const verify = async (req, res) => {
    try {

        const { Code } = req.body
        const user = await User.findById(req.user.id)

        if (user?.VerificationCode == Code) {
            user.IsVerified = true
        }

        await user.save()

        return res.status(200).json({
            message: "Email Id Verified"
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

// const status = async ()=>{
//     try {

//     } catch (error) {
//         return res.status(500).json({
//             message: error.message,
//             error: error
//         })
//     }
// }

const me = async (req, res) => {
    try {
        const id = req.user.id

        const user = await User.findById(id).select("-Password").populate({
            path: "Profile"
        })

        return res.status(200).json({
            User: user
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const updatePassword = async (req, res) => {
    try {
        const id = req.user.id

        const { NewPassord, Password } = req.body

        if (NewPassord.length < 8) throw new Error("Password Should Be Atleast of 8 Character")

        const user = await User.findById(id)

        const isMatched = await bcrypt.compare(Password, user.Password)

        if (!isMatched) throw new Error('Password Didnot Matched')

        const hashed = await bcrypt.hash(NewPassord, 10)

        user.Password = hashed

        await user.save()

        return res.status(200).json({
            message: "Password Changed"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const SendVerificationCode = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user.Email) throw new Error("Email Not Added")

        const Code = Math.floor(Math.random() * 1000000) + 999999

        transporter.sendMail({
            from: process.env.GMAIL,
            to: user?.Email,
            subject: 'Code To Verify',
            text: 'This is a Verification email sent to Verify',
            html: `<b>Your Code is ${Code} </b>`
        },
            async (error, info) => {
                if (error) {
                    return res.status(500).json({
                        message: "SomeThing Went Wrong Is Your Email Correct?"
                    })
                } else {
                    user.VerificationCode = Code
                    await user.save()
                }
            }
        )

        res.status(200).json({
            message: "Code Sent Succesfully"
        })




    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const forgotPassword = async (req, res) => {
    try {

        const { UserName } = req.body

        const user = await User.findOne({ UserName: UserName })

        if (!user) throw new Error("Check Your UserName")

        if (!user.Email) throw new Error("You Don't Have Email !!")

        if (!user.IsVerified) throw new Error("Sorry Your Email Is Not Verified")

        const code = jwt.sign({ id: user._id }, process.env.JWT_VERIFY, { expiresIn: '1h' })

        let Link = `https://anpranx.netlify.app/verify/${code}`

        transporter.sendMail({
            from: process.env.GMAIL,
            to: user?.Email,
            subject: 'Code To Verify',
            text: 'This is a Link Please Kindly Click And Change Password',
            html: `<a href=${Link}> Head To Anprax </a>`
        },
            async (error, info) => {
                if (error) {
                    return res.status(500).json({
                        message: "SomeThing Went Wrong Is Your Email Correct?"
                    })
                }
            })

        res.status(200).json({
            message: 'Email Sent To You SuccesFully'
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}


const changePasswordByForgeting = async (req, res) => {
    try {
        const { NewPassowrd, Code } = req.body
        if (!NewPassowrd || !Code) throw new Error("Somehing is Incomplete")

        if (NewPassowrd.length < 8) throw new Error("Password Length Should be Atleast 8 Character")

        const decoded = jwt.verify(Code, process.env.JWT_VERIFY)

        const user = await User.findById(decoded?.id)

        if (!user) throw new Error("Please Check Your Link")

        const hashed = await bcrypt.hash(NewPassowrd, 10)

        user.Password = hashed

        await user.save()

        return res.status(200).json({
            message: "Password Changed"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const addEmail = async (req, res) => {
    try {
        const id = req.user.id
        const { Email } = req.body

        if (!Email) throw new Error("Please Provide Email")

        if (!validator.isEmail(Email)) throw new Error("This is Not Valid Email")

        const user = await User.findById(id)

        user.Email = Email
        user.IsVerified = false
        user.VerificationCode = ''

        await user.save()

        return res.status(200).json({
            message: "Email is Added "
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}




const updateGeneralInfo = async (req, res) => {
    try {
        const id = req.user.id
        const { Name, Gender } = req.body
        const user = await User.findById(id)

        if (!Name, !Gender) throw new Error('Name and Gender Are Required to Change')

        user.Name = Name
        user.Gender = Gender

        await user.save()

        return res.status(200).json({
            message: "User is Update "
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}
const addPhoto = async (req, res) => {
    try {
        const id = req.user.id
        const { Image } = req.files

        const user = await User.findById(id)

        const result = await cloudinary.uploader.upload(Image.tempFilePath, { folder: 'Profiles' })

        const profile = new Profile({
            Link: result.url,
            ID: result.public_id,
            User: user?._id
        })

        await profile.save()

        user.Profile = profile?._id

        await user.save()


        return res.status(200).json({
            message: "Profile Is Saved"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const removeProfile = async () => {
    try {
        const id = req.user.id

        const user = await User.findById(id)

        const profile = await Profile.findOne({ User: id })

        const result = await cloudinary.uploader.destroy(profile.public_id)

        user.Profile = ''
        await User.save()


        await profile.deleteOne()

        return res.status(200).json({
            message: "Profile Removed"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

const getProfile = async (req, res) => {
    try {
        const { id } = req.params

        const mineId = req.user.id

        const me = await User.findById(id)

        const user = await User.findById(id).select("-Password -Chats -Saves -SentRequest -ReceivedRequest -VerificationCode").populate({
            path: "Friends",
            select: "_id Name UserName Profile"
        }).populate("Posts")

        let isfriends = false
        let isRequested = false
        let isReceivedRequest = false

        isfriends = user.Friends?.some(friend => friend._id.toString() === mineId);

        // Check if I sent request to this user
        isRequested = me.SentRequest?.some(requestId => requestId.toString() === user._id.toString());

        // Check if I received request from this user
        isReceivedRequest = me.ReceivedRequest?.some(requestId => requestId.toString() === user._id.toString());


        return res.status(200).json({
            Data: user,
            isMineId: id === mineId,
            isfriends, isRequested, isReceivedRequest
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}





module.exports = {
    login,
    register,
    me,
    verify,
    updatePassword,
    addPhoto,
    removeProfile,
    forgotPassword,
    SendVerificationCode,
    updateGeneralInfo,
    changePasswordByForgeting,
    addEmail,
    getProfile
}