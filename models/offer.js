import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const {Schema} = mongoose
const offerSchema = new Schema({
    job_id: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    provider_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    offer_price: {
        type: Number,
        required: true,
    },
    offer_finish_estimated_time: {
        type: Number,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
    introduction: {
        type: String,
        required: true,
    },
    create_time: {
        type: Date,
        required: true,
    }
});

export default mongoose.model('Offer', offerSchema) ;