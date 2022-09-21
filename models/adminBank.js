import mongoose from "mongoose";

const {Schema} = mongoose
const adminBank = new Schema({
    admin_id: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    bank_name: {
        type: String,
        required: true,
    },
    account_number: {
        type: String,
        required: true,
    },
    bank_branch: {
        type: String,
        required: true,
    },
    account_name: {
        type: String,
        required: true,
    },
    create_time: {
        type: Date,
        default: Date.now(),
        required: true,
    },
});

export default mongoose.model('adminBank', adminBank) ;