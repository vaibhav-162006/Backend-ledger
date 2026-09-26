const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service")

async function userRegister(req, res) {
    const { email, password, name } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string" || !email.trim() || !name.trim() || password.length < 6) {
        return res.status(400).json({ message: "Valid email, name and password (at least 6 characters) are required" });
    }

    const isExists = await UserModel.findOne({
        email: email
    });

    if (isExists) {
        return res.status(422).json({
            message: "User already exists",
            status: "failed"
        });
    }

    const user = await UserModel.create({
        email,
        password,
        name
    });

    const token = jwt.sign(
        {
            userId: user._id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "3d"
        }
    );

  
    await emailService.sendRegisterEmail(user.email, user.name);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 3 * 24 * 60 * 60 * 1000 });

    return res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}
/**
 * - User Login Controller
 * - POST /api/auth/login
 */
async function userLogin(req,res){
const{email , password} = req.body || {};
if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required" });
}

const user = await UserModel.findOne({ email }).select("+password")
if(!user){
    return res.status(401).json({
        message: "Email or password is Invalid"
    })

} 
const isVaildPassword = await user.comparePassword(password)
if(!isVaildPassword){
    return res.status(401).json({
        message: "Email or password is Invalid"
})
}
const token = jwt.sign(
    {
        userId: user._id
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "3d"
    }
);

res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 3 * 24 * 60 * 60 * 1000 });

return res.status(200).json({
    user: {
        _id: user._id,
        email: user.email,
        name: user.name
    },
    token
});
 
}
 
module.exports = {
    userRegister,
    userLogin 
}; 
