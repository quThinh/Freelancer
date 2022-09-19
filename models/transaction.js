import mongoose from "mongoose";

const {Schema} = mongoose
const transactionSchema = new Schema({
    wallet_id: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    direction: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    amount : {
        type: Number,
        required: true,
    },
    fee: {
        type: Number,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
    transaction_time: {
        type: Date,
        default: Date.now(),
        required: true,
    },
    order_id: {
        type: Schema.Types.ObjectId,
        required: false,
    },
    refference_code: {
        type: String,
        required: false,
    }
});

export default mongoose.model('Transaction', transactionSchema) ;

