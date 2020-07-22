const mongoose = require('mongoose')

const EmailPinSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Must Enter a Email"],
        trim: true,
        lowercase: true,
        unique: true
    },
    pin_num: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

const emailPin = mongoose.model('emailPin', EmailPinSchema);
module.exports = { emailPin };