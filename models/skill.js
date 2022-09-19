import mongoose from "mongoose";
const {Schema} = mongoose
const skillSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        required: false,
    }
});

export default mongoose.model('Skill', skillSchema) ;