import mongoose from "mongoose";
import WalletStatus from "./walletStatus.js";

const {Schema} = mongoose
const walletSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min : 0
    },
    available_balance: {
        type: Number,
        require: true,
        default: 0,
        min: 0,
    },
    status: {
        type: String,
        required: true,
        enum: WalletStatus,
        default: 1
    },
    create_time: {
        type: Date,
        require: true,
        default: Date.now()
    }
});

export default mongoose.model('Wallet', walletSchema) ;