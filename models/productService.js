import mongoose from "mongoose";

const {Schema} = mongoose
const productSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: [Schema.Types.ObjectId],
        ref: "category",
        required: true,
    },
    skill: {
        type: [Schema.Types.ObjectId],
        ref: "skill",
        required: true,
    },
    providing_method: {
        type: [String],
        required: true,
    },
    finish_estimated_time: {
        type: Number,
        required: true,
    },
    lower_bound_fee: {
        type: Number,
        required: true,
    },
    upper_bound_fee: {
        type: Number,
        required: true,
    },
    status: {
        type: Number,
        default: 0,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    create_time: {
        type: Date,
        default: Date.now(),
        required: true,
    },
    expiration_time: {
        type: Date,
        required: true,
    },
    image: {
        type: [String],
        required: false,
    },
    description: {
        type: String,
        required: true,
    },
    sold_time: {
        type: Number,
        default: 0,
        required: false,
    },
    rate: {
        type: Number,
        default: 0,
        required: false,
    },
    number_of_rate: {
        type: Number,
        default: 0,
        required: false,
    },
    required_level: {
        type: [String],
        required: false,
    },
    payment_method: {
        type: String,
        required: false,
    },
});

export default mongoose.model('product', productSchema) ;