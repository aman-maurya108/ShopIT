import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import User from '../models/user.js';
import { getResetPasswordTemplate } from '../utils/emailTemplates.js';
import ErrorHandler from '../utils/errorHandler.js';
import sendToken from '../utils/sendToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config();

//Register user => /api/v1/register
export const registerUser = catchAsyncErrors(async (req,res,next) => {
    const {name, email, password} = req.body;

    const user = await User.create({
        name,email,password,
    });

    const token  = user.getJwtToken();

    res.status(201).json({
        success:true,
        token,
    });
 });

 //login user => /api/v1/login
export const loginUser = catchAsyncErrors(async (req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return next(new ErrorHandler('Please email & password',400));
    }

    //Find user in the database
    const user = await User.findOne({email}).select("+password")

    if(!user){
        return next(new ErrorHandler('Invalid email or password',400));
    }

    //check if password is correct
    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler('Invalid email or password!',401));
    }
    sendToken(user,200,res)
});

//logout user => /api/v1/logout 
export const logout = catchAsyncErrors(async (req,res,next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })

    res.status(200).json({
        message:"Logged out!",
    })
});

//forgot password =>/api/v1/password/forgot
export const forgotPassword = catchAsyncErrors(async (req,res,next)=>{
    //find user in the database
   
    const user = await User.findOne({ email:req.body.email }); 


    if(!user){
        return next(new ErrorHandler("User not found with this email",404));
    }

    //get reset password token
    const resetToken = user.getResetPasswordToken();

    await user.save();

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

        await user.save();
        return next(new ErrorHandler(error?.message,500));
    }
});

//reset password =>/api/v1/password/reset/:token
export const resetPassword = catchAsyncErrors(async (req,res,next)=>{
    
    //hash the url token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt:Date.now()}
    })

    if(!user){
        return next(new ErrorHandler("Password reset token is invalid or has been expired!",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match!",400)); 
    }

    //set the new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);
});

//get current user profile => /api/v1/me
export const getUserProfile = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req?.user?._id);
    
    res.status(200).json({
        user,
    });
});

//update password => /api/v1/password/update
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body; // Expect newPassword instead of password

    // Check if new password is provided
    if (!newPassword) {
        return next(new ErrorHandler("Please enter your new password", 400));
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // Check if old password matches
    const isPasswordMatched = await user.comparePassword(oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    // Update the password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); 

    res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
});

//update user profile  /api/v1/me/update
export const updateProfile= catchAsyncErrors(async (req, res, next) => {
    const newUserData= {
        name: req.body.name,
        email: req.body.email,
    };

    const user= await User.findByIdAndUpdate(req.user._id, newUserData,{
        new:true,
    });


    res.status(200).json({
       user,
    });
});

//get all users - ADMIN  /api/v1/admin/users
export const allUsers= catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
       users,
    });
});

//get user details - ADMIN  /api/v1/admin/user/:id
export const getUserDetails= catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`,404))
    }

    res.status(200).json({
       user,
    });
});

//update user details - ADMIN  /api/v1/admin/users/:id
export const updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true, 
    });

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});


//delete user details - ADMIN  /api/v1/admin/users/:id
export const deleteUser= catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`,404))
    }
    //Todo - remove user avatar from cloudinary
    await user.deleteOne();


    res.status(200).json({
       success: true,
    });
});