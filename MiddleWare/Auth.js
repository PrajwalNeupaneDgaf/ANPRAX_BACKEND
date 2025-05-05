const jwt = require("jsonwebtoken");
const User = require("../Model/User");

const Auth = async (req, res, next) => {
    try {
        const tokenHeader = req.headers['authorization']; // or req.get('Authorization')

        // Token format: "Bearer <your-token-here>"
        if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = tokenHeader.split(' ')[1]

        const decoded = jwt.verify(token, process.env.JWT_PASSWORD); // use your secret

        const user= await User.findById(decoded.id)
        if(!user) throw new Error("User Not Found")
        req.user = decoded; // optionally store it in the request
        next();

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: error
        })
    }
}

module.exports = Auth