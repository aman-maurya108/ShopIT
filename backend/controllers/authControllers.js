import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import user from '../models/user.js';
import { getResetPasswordTemplate } from '../utils/emailTemplates.js';
import ErrrorHandler from '../utils/errorHandler.js';
import sendToken from '../utils/sendToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config();

//Register user => /api/v1/register
export const registerUser = catchAsyncErrors(async (req,res,next)=>{
    const {name,email,password} = req.body;

    const User = await user.create({
        name,email,password,
    });

    sendToken(User,201,res)
});

//login user => /api/v1/login
export const loginUser = catchAsyncErrors(async (req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return next(new ErrrorHandler('Please email & password',400));
    }

    //Find user in the database
    const User = await user.findOne({email}).select("+password")

    if(!User){
        return next(new ErrrorHandler('Invalid email & password',400));
    }

    //check if password is coorect
    const isPasswordMatched = await User.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrrorHandler('Invalid email or password',401));
    }
    sendToken(User,200,res)
});

//logout user => /api/v1/logout
export const logout = catchAsyncErrors(async (req,res,next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })

    res.status(200).json({
        message:"Logged out",
    })
});

//forgot password =>/api/v1/password/forgot
export const forgotPassword = catchAsyncErrors(async (req,res,next)=>{
    //find user in the database
   
    const User = await user.findOne({ email:req.body.email }); 


    if(!User){
        return next(new ErrrorHandler("User not found with this email",404));
    }

    //get reset password token
    const resetToken = User.getResetPasswordToken();

    await User.save();

    //create reset password url
    const resetUrl = `${process.env.FRONTEND_URL}/api/v1/password/reset/${resetToken}`;

    const message = getResetPasswordTemplate(user?.name,resetUrl);

    try{
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message,
        });
        res.status(200).json({
            message: `Email sent to :${user.email}`,
        });
    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await User.save();
        return next(new ErrrorHandler(error?.message,500));
    }
});

//reset password =>/api/v1/password/reset/:token
export const resetPassword = catchAsyncErrors(async (req,res,next)=>{
    
    //hash the url token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const User = await user.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt:Date.now()}
    })

    if(!User){
        return next(new ErrrorHandler("Password reset token is invalid or has been expired",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrrorHandler("Password does not match",400)); 
    }

    //set the new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await User.save();

    sendToken(user,200,res);
});