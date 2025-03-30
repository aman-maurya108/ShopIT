import ErrorHandler from "../utils/errorHandler.js";

export default (err, req, res, next)=>{
    let error ={
        statusCode : err?.statusCode || 500,
        message: err?.message || "Internal server error",
    };
    //handle invalid mongoose id error
    if(err.name=== "CastError"){
        const message = `Resource not found. Invalid: ${err?.path}`
        error =new ErrorHandler(message,400);
    }
    //handle validation error
    if(err.name=== "ValidationError"){
        const message = Object.values(err.errors).map((value)=>value.message);
        error =new ErrorHandler(message,404);
    }

     //handle  mongoose Duplicate key error
     if(err.name=== 1100){
        const message = `Duplicate ${Object.keys(err.keyValue)}entered`;
        error =new ErrorHandler(message,404);
    }

     //handle  wrong JWT error
     if(err.name=== "jsonWebTokenError"){
        const message = `JSON Web Token is invalid.Try Again!!!`;
        error =new ErrorHandler(message,400);
    }

     //handle expired JWT error
     if(err.name=== "TokenExpiredError"){
        const message = `JSON Web Token is expired.Try Again!!!`;
        error =new ErrorHandler(message,404);
    }

    if(process.env.NODE_ENV === "DEVELOPMENT"){
        res.status(error.statusCode).json({
            message: error.message,
            error:err,
            stack: err?.stack,
        });
    }
    if(process.env.NODE_ENV === "PRODUCTION"){
        res.status(error.statusCode).json({
            message: error.message,
        });
    }


    
};