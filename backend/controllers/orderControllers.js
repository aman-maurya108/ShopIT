import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import ErrorHandler from "../utils/errorHandler.js";

//create new order => /api/v1/orders/new
export const newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        paymentInfo,
        paymentMethod,
        itemsPrice,
        taxAmount,
        shippingAmount,
        totalAmount,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return next(new ErrorHandler("No order items", 400));
    }

    const order = await Order.create({
        user: req.user._id,
        orderItems,
        shippingInfo,
        paymentInfo,
        paymentMethod,
        itemsPrice,
        taxAmount,
        shippingAmount,
        totalAmount,
        orderStatus: "Processing",
        createdAt: Date.now(),
    });

    res.status(201).json({
        success: true,
        order,
    });
});

// Get current user Order Details => /api/v1/me/orders
export const myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({user: req.user._id});

    if (!orders) {
        return next(new ErrorHandler("No Orders found", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});


// Get Order Details => /api/v1/order/:id
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate("user", "name email"); 

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});
// get all orders -ADMIN => api/v1/admin/orders
export const allOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();

    res.status(200).json({
        success: true,
        orders,
    });
});

// Update Order Status - ADMIN => /api/v1/admin/orders/:id
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("This order has already been delivered", 400));
    }

    order.orderStatus = req.body.status;

   

    //update product stock
    order?.orderItems?.forEach(async(item)=>{
        const product = await Product.findById(item?.product?.toString());
        if(!product){
            return next(new ErrorHandler("No product found with this ID", 404));
        }
        product.stock = product.stock - item.quantity;
        await product.save({validateBeforeSave : false});
    })

        req.body.status = req.body.status;
        order.deliveredAt = Date.now();
   
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order updated successfully",
    });
});

// Delete Order - ADMIN => /api/v1/admin/orders/:id
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id); 

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    await order.deleteOne(); // Deletes the order

    res.status(200).json({
        success: true,
        message: "Order deleted successfully",
    });
});