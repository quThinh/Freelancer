import mongoose from "mongoose";

const {Schema} = mongoose
const authUserSchema = new Schema({
    email: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true,
    }
});

export default mongoose.model('AuthUser', authUserSchema) ;
