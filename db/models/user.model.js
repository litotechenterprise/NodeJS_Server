//jshint esversion:6
// Place holder for user Model
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const _ = require('lodash');

const notificationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    requestType:{
        type: String,
        enum: ['NewFriend', 'Accepted'],
        required: true,
        trim: true,
    },
    userID: {
        type: String,
        required: true,
    },
    message:[Number]
},{
    timestamps: true
});


const friendSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    userID: {
        type: String,
        required: true,
        trim: true
    },
});

const friendRequestSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    requestType:{
        type: String,
        enum: ['sent', 'received', 'attend'],
        required: true,
        trim: true,
    },
    userID: {
        type: String,
        required: true,
    },
    message:{
        type: String
    }
},{
    timestamps: true
});


const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        required: [true, "Must Enter a Username"],
        trim: true,
        unique: true
    },
    firstName: {
        type: String,
        required: [true, "Must Enter a first name"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Must Enter a last name"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Must Enter a Email"],
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: [true, "Must Enter a Password"],
        trim: true,
        minlength: 6,
        // validate(value) {
        //     if (value.toLowerCase().includes('password')) {
        //         throw new Error('Password cannot include the word "password"');
        //     }
        // }
    },
    bio:{
        type:String,
        required:true
    },
    friendRequests: [friendRequestSchema],
    friendsArray: [friendSchema],
    notifications:[notificationSchema],
    refreshFFeed: Number,
    refreshCFeed: Number,
    profilePic: {
        type:Buffer,
    },
    recentlyViewed:[String],
    tokens: [{
        token:{
            type:String,
            required: true
        }
    }] 
}, {
    timestamps: true
});

UserSchema.virtual('userCreatedEvents', {
    ref: 'Event',
    localField:'_id',
    foreignField:'owner'
})

UserSchema.virtual('usersConverations', {
    ref: 'chat',
    localField:'_id',
    foreignField:'userID'
})


UserSchema.methods.toJSON = function(){

    const userInstance = this;
    const userObject = userInstance.toObject();

    // return the document except the password and sessions
    // TODO omit sessions
    return _.omit(userObject, ['password', 'tokens', 'firstName', 'lastName', 'friendsArray', 'photo',"profilePic"]);

}

UserSchema.pre('save', async function (next) {
    const user = this;

    if(user.isModified('password')) {
        user.password = bcrypt.hash(user.password, 10)
    }

    next()
})

// Delete user events when user is deleted
// UserSchema.pre('remove', async function (next) {
//     const user = this
//     await event.deleteMany({owner: user._id})
//     console.log('problem')
//     next()
// })


const user = mongoose.model('user', UserSchema);
const friendRequest = mongoose.model('friendRequest', friendRequestSchema);
const friend = mongoose.model('friend', friendSchema);
const notifications = mongoose.model('notifications',notificationSchema )
module.exports = { user, friendRequest, friend, notifications };