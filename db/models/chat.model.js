const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    text: {
        type:String,
    },
    user: {
        _id:{
            type:String,
            trim:true
        }, 
        avatar: {
            type:String,
            trim:true
        }
    },
    
},
    {
        timestamps: true
})

const convoSchema = mongoose.Schema({
   participants:[{
       userID: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref:'userID'
       },
       username: {
        type: String,
        required:true,
        trim: true
       },
   }],
   messages:[messageSchema]
},
    {
        timestamps: true
})




var convos = mongoose.model('chat', convoSchema);
var message = mongoose.model('message', messageSchema);
module.exports = {convos, message};