import mongoose from 'mongoose'
const {Schema} = mongoose

const serviceSchema = new Schema ({
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
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    create_time: {
        type: Date,
        required: true,
    },
    expiration_time: {
        type: Date,
        required: true,
    },
    image: {
        type: [String],
        required: false,
    }
    // sold_time: {
    //     type: Number,
    //     required: false,
    // },
    // rate: {
    //     type: Number,
    //     required: false,
    // },
    // number_of_rate: {
    //     type: Number,
    //     required: false,
    // },
})

export default mongoose.model('service', serviceSchema)

