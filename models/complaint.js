import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const {Schema} = mongoose
const complaintSchema = new Schema({
    order_id: {
        type: ObjectId,
        ref: 'Order',
        required: true,
    },
    client_id: {
        type: String,
        ref: 'User',
        required: true,
    },
    complain: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
    admin_id: {
        type: ObjectId,
        ref: 'User',
        required: true,
    },
    create_time: {
        type: Date,
    },
});

export default mongoose.model('complaint', complaintSchema) ;