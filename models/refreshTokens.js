import mongoose from "mongoose";

const {Schema} = mongoose
const refreshToken = new Schema({
    accessToken: {
        type: String,
        require: true,
    },
    refreshToken: {
        type: String,
        require: true,
    }
});

export default mongoose.model('refressToken', refreshToken) ;
