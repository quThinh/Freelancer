import mongoose from "mongoose";

const {Schema} = mongoose
const userSchema = new Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
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
        required: true,
    }

});

export default mongoose.model('User', userSchema) ;

