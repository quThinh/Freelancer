import mongoose from "mongoose";

const {Schema} = mongoose
const orderSchema = new Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'product',
        required: true,
    },
    provider_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        default: "service" | "job",
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
    note: {
        type: String,
        required: true,
    },
    estimated_time: {
        type: Number,
        required: true,
    },
    create_time: {
        type: Date,
        default: Date.now(),
        required: true,
    },
    cancel_note: {
        type: String,
        required: false,
    },
});

export default mongoose.model('Order', orderSchema) ;

