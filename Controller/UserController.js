const User = require("../Model/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const nodeMailer = require('nodemailer')

const validator = require('validator')
const cloudinary = require("../Utils/Cloudinary")

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
        await newUser.save()
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
        } else {
            throw new Error("Invalid Code")
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
            path: "SentRequest",
            select: "Name UserName _id Profile "
        }).populate({
            path: "ReceivedRequest",
            select: "Name UserName _id Profile "
        }).populate({
            path: "Friends",
            select: "Name UserName _id Profile "
        }).populate({
            path: "Blocks",
            select: "Name UserName _id Profile "
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

        const { NewPassword, Password } = req.body

        if (NewPassword.length < 8) throw new Error("Password Should Be Atleast of 8 Character")

        const user = await User.findById(id)

        const isMatched = await bcrypt.compare(Password, user.Password)

        if (!isMatched) throw new Error('Password Didnot Matched')

        const hashed = await bcrypt.hash(NewPassword, 10)

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
            subject: `Code To Verify to ${user?.Name}`,
            text: 'This is a Verification email sent to Verify',
            html: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
      <h2>Verify Your Account</h2>
      <p>Hello${user?.Name ? ` ${user.Name}` : ''},</p>
      <p>Here is your verification code:</p>
      <p style="font-size: 20px; font-weight: bold; color: #4CAF50;">${Code}</p>
      <p>If you didn’t request this, please ignore this email.</p>
      <hr />
      <p style="font-size: 12px; color: #999;">This email was sent by Anprax</p>
    </div>
  `
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

        const code = jwt.sign({ id: user._id }, process.env.JWT_VERIFY, { expiresIn: '10m' })

        let Link = `https://anpranx.netlify.app/forgot-password/${code}`

        transporter.sendMail({
            from: process.env.GMAIL,
            to: user?.Email,
            subject: 'Verify Your Account - Anprax',
            text: `Hi ${user?.Name || 'there'},\n\nClick the link below \n${Link}`,
            html: `<p>Hi ${user?.Name || 'there'},</p>
                    <p>You Have Requested to Change your password for anpranx.netlify.app if you want to </p>
                    <a href="${Link}" style="padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none;">Verify Email</a>
                    <p>If you didn’t request this, you can ignore this email.</p>`
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
        const { NewPassword, Code } = req.body
        if (!NewPassword || !Code) throw new Error("SomeThing is Incomplete" + NewPassword + " Or " + Code)

        if (NewPassword.length < 8) throw new Error("Password Length Should be Atleast 8 Character")

        const decoded = jwt.verify(Code, process.env.JWT_VERIFY)

        const user = await User.findById(decoded?.id)

        if (!user) throw new Error("Please Check Your Link")

        const hashed = await bcrypt.hash(NewPassword, 10)

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

      if(user?.Email){
          if (user?.Email?.toLowerCase() === Email.toLowerCase()) throw new Error("Can't Use The Same Email")
      }

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


        user.Profile = result.url
        user.ProfileId = result.public_id,

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

const removeProfile = async (req, res) => {
    try {
        const id = req.user.id

        const user = await User.findById(id)
        if (!user.ProfileId) throw new Error("Please Add Profile First")

        const result = await cloudinary.uploader.destroy(user.ProfileId)



        user.Profile = 'https://static.vecteezy.com/system/resources/previews/021/548/095/original/default-profile-picture-avatar-user-avatar-icon-person-icon-head-icon-profile-picture-icons-default-anonymous-user-male-and-female-businessman-photo-placeholder-social-network-avatar-portrait-free-vector.jpg'
        user.ProfileId = ""
        await user.save()


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

        const me = await User.findById(mineId)

        const user = await User.findById(id).select("-Password -Chats -Saves -SentRequest -ReceivedRequest -VerificationCode").populate({
            path: "Friends",
            select: "_id Name UserName Profile"
        }).populate({
            path: "Posts",
            options: { sort: { createdAt: -1 } }, // Sort posts by newest
            populate: [
                { path: "Image" }, // Populate Image inside each post
                { path: "User", select: "Name UserName Profile" } // Optional: select specific User fields
            ]
        })
        const isBlocked = me.Blocks.some(itm => itm.toString() == id)
        const isHeBlocked = user.Blocks.some(itm => itm.toString() == mineId)

        if (isBlocked || isHeBlocked) {
            throw new Error("You Are Blocked Or You May Have Blocked")
        }


        let isfriends
        let isRequested
        let isReceivedRequest

        isfriends = me.Friends?.some(itm => itm.toString() == id)


        // Check if I sent request to this user
        isRequested = me.SentRequest?.some(itm => itm.toString() == id)


        // Check if I received request from this user
        isReceivedRequest = me.ReceivedRequest?.some(itm => itm.toString() == id)

        return res.status(200).json({
            Data: user,
            isMineId: id === mineId,
            isfriends,
            isRequested,
            isReceivedRequest,
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