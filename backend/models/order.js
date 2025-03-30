import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            }
        }
    ],
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: [true, "Please select payment method"],
        enum: {
            values: ["COD","Card"],
            message: "Please select: COD or Card",
        },
    },
    paymentInfo: {
        id: String,
        status: String
    },

    itemsPrice: { type: Number, required: true, default: 0.0 },

    taxAmount: { type: Number, required: true, default: 0.0 },
  
    shippingAmount: { type: Number, required: true, default: 0.0 },
  
    totalAmount: { type: Number, required: true, default: 0.0 },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered'],
        default: 'Processing'
    },
    deliveredAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Order', orderSchema);
