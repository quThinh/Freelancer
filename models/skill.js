import mongoose from "mongoose";

// interface IUser {
//     fullname: String;
//     email: String;
//     phone: String;
//     hashed_password: String;
//     birthday?: Date;
//     address?: String;
//     type: String;
//     status: Int32;
//     del_flag: Boolean;
//     create_time: Date;
//     active_token: String;
//     api_key: String;
// }
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