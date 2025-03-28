import express from "express"
const app =express()
import dotenv from "dotenv"
import { connectDatabase } from "./config/dbConnect.js";
import errorMiddleware from "./middlewares/errors.js";
import cookieParser  from "cookie-parser";
//Handle Uncaught Exception
process.on("uncaughtException",(err)=>{
    console.log(`ERRROR: ${err}`);
    console.log("Shutting down due to uncaught Exception");
    process.exit(1);
});


dotenv.config({path: "backend/config/config.env"});
//connecting to database
connectDatabase();
app.use(express.json());
app.use(cookieParser());

//import all routes
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";


app.use("/api/v1",productRoutes);
app.use("/api/v1",authRoutes);


app.use(errorMiddleware);

const server = app.listen(process.env.PORT,()=>{
    console.log(`server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});

//handle unhandled promise rejection
process.on("unhandledRejection",(err)=>{
    console.log(`ERROR: ${err}`);
    console.log(`Shuttting down server due to unhandled promise rejection`);
    server.close(()=>{
        process.exit(1);
    })
});
