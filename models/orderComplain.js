import mongoose from "mongoose";

const {Schema} = mongoose
const orderComplainSchema = new Schema({
    order_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    admin_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    complain: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
    create_time: {
        type: Date,
        default: new Date(),
        required: true,
    }
});

export default mongoose.model('OrderComplain', orderComplainSchema) ;