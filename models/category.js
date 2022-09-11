import mongoose from "mongoose";

const {Schema} = mongoose
const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    priority: {
        type: Number,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
});

export default mongoose.model('Category', categorySchema) ;