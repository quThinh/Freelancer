import mongoose from "mongoose";
import { stringify } from "uuid";
import skill from "./skill.js";


const { Schema } = mongoose
const productSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: [Schema.Types.ObjectId],
        ref: "Category",
        required: false,
    },
    skill: [{
        name: {type: String},
        slug: {type: String},
        image: {type: String, required: false},
    }],
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
        default: new Date(),
        required: true,
    },
    expiration_time: {
        type: Date,
    },
    image: {
        type: [String],
        required: false,
    },
    description: {
        type: String,
        required: false,
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
    slug: {
        type: String,
        required: true,
    }
});

export default mongoose.model('product', productSchema);