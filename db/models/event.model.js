// jshint esversion:6
const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
});

const Guest = new mongoose.Schema({
    guestname:{
        type: String,
        required:true,
        trim: true
    },
    guestID: {
        type: String,
        required:true,
        trim: true
    }
}, {
    timestamps: true
})

const EventRequestSchema = new mongoose.Schema({
    eventDescription: {
        type:String,
        required:true,
        trim:true
    },
    eventID: {
        type:String,
        required:true,
        trim:true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    userID: {
        type: String,
        required: true,
    },
    message:{
        type: String,
        trim: true
    }
},{
    timestamps: true
});


const EventSchema = new mongoose.Schema({

    location: {
        type: PointSchema,
        required: true,
        trim: true
    },
    title: {
        // General (Place to Be), Food, Community Service, etc.
        type: String, 
        required: true,
        minlength: 3,
        trim: true
    },
    description: {
        // Description of Event
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    toWhere: {
        type: String,
        enum: ['friends', 'community'],
        required: true,
        minlength: 2,
        trim: true
    },
    privacy: {
        type:Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'user'
    },
    username: {
        type: String,
        required:true,
        trim: true
    },
    guestList:[Guest],
    eventRequests: [EventRequestSchema],
    startTime: {
        type:String,
        required:true
    },
    endTime: {
        type:String,
        required:true
    },

}, {
    timestamps: true
});

EventSchema.virtual('createEventsReq', {
    ref: 'Event',
    localField:'_id',
    foreignField:'eventId'
})

EventSchema.index({location: "2dsphere"}); // Indexes the schema w/ 2d location https://docs.mongodb.com/manual/geospatial-queries/


const event = mongoose.model('Event', EventSchema);
const point = mongoose.model('point', PointSchema);
const eventReq = mongoose.model('eventReq', EventRequestSchema);
const guest = mongoose.model('guest', Guest);
module.exports = { event, point, eventReq, guest};