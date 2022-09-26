import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const { Schema } = mongoose
const userSchema = new Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    avatar: {
        type: String,
        required: false
    },
    phone: {
        type: String,
    },
    hashed_password: {
        type: String,
        required: true,
    },
    birthday: {
        type: Date,
    },
    address: {
        type: String,
    },
    sex: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
    del_flag: {
        type: Boolean,
        required: true,
    },
    create_time: {
        type: Date,
        required: true,
    },
    active_token: {
        type: String,
        required: true,
    },
    api_key: {
        type: String,
        required: false,
    },
    referal_code: {
        type: String,
        required: false,
    },
    category: {
        type: [ObjectId],
        ref: 'Category',
        required: false,
    },
    skill: [{
        name: {
            type: String,
        },
        slug: {
            type: String,
        }
    }],
    successful_rate: {
        type: Number,
        required: false,
    },
    introduction: {
        type: String,
        required: false,
    },
    sold_time: {
        type: Number,
        required: false,
    },
    rate_star: {
        type: Number,
        required: false,
    },
    rate_number: {
        type: Number,
        required: false,
    },
    social_media_contact: [{
        link: {
            type: String,
        },
        media: {
            type: String,
        }
    }],
});

export default mongoose.model('User', userSchema);

