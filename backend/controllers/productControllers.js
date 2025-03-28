import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Product from "../models/product.js"
import APIFilters from "../utils/apiFilters.js";
import ErrrorHandler from "../utils/errorHandler.js";

//get all Product =>/api/v1/product
export const getProducts = catchAsyncErrors(async(req,res)=>{
    
    const resPerPage = 4;
    const apiFilters = new APIFilters(Product,req.query).search().filters();
    let products = await apiFilters.query;

    let filteredProductsCount = products.length;

    apiFilters.pagination(resPerPage);

    products = await apiFilters.query.clone();

    res.status(200).json({
        resPerPage,
        filteredProductsCount,
        products,
    });
});

//create new Product =>/api/v1/admin/products
export const newProduct = catchAsyncErrors(async(req,res)=>{

    req.body.user = req.user._id
    const product= await Product.create(req.body)
    res.status(200).json({
product,
    });
});

//get single Product detail=>/api/v1/products/:id
export const getProductDetails = catchAsyncErrors(async(req,res,next)=>{
    const product = await Product.findById(req?.params?.id);
    if(!product){
        return next(new ErrrorHandler("Product not found",404));
    }
    res.status(200).json({
        product,
    });
});

//update Product detail=>/api/v1/products/:id
export const updateProduct = catchAsyncErrors(async(req,res)=>{
    let product = await Product.findById(req?.params?.id);
    if(!product){
        return next(new ErrrorHandler("Product not found",404));
    }

    product = await Product.findByIdAndUpdate(req?.params?.id,req.body,{new: true});
    res.status(200).json({
        product,
    });
});

//delete Product detail=>/api/v1/products/:id
export const deleteProduct = catchAsyncErrors(async(req,res)=>{
    const product = await Product.findById(req?.params?.id);
    if(!product){
        return next(new ErrrorHandler("Product not found",404));
    }

    await product.deleteOne();
    res.status(200).json({
        message:"Product Deleted",
    });
});