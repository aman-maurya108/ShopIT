import ErrrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";
import user  from "../models/user.js";
import jwt from "jsonwebtoken";


//check if user is authentication or not
export const isAuthenticatedUser = catchAsyncErrors(async (req,res,next) =>{
    const {token} = req.cookies;

    if(!token){
        return next(new ErrrorHandler("Login first to access this resource",401));
    }

    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = await user.findById(decoded.id);

    next();
});

//Authorize user roles
export const authorizeRoles = (...roles) =>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrrorHandler(`Role (${req.user.role}) is not allowed to access this resource`,403));
        }

        next();
    };
};