const mongoose = require('mongoose');
const Mongodb_Passoword = 'Dtgfu1314!'
const DB_Name ="MainDB"
const DB_UserName = "CEO_Lito"

const mongoURI = "mongodb+srv://"+DB_UserName+":"+Mongodb_Passoword+"@maindb-vbe1p.mongodb.net/"+DB_Name+"?retryWrites=true&w=majority"
mongoose.Promise = global.Promise;
mongoose.connect(mongoURI, { useNewUrlParser: true}).then(() => {
    console.log("Connected to MongoDB successfully");
}).catch((e) => {
    console.log("Error while attempting to connect to MongoDB");
    console.log(e);
});


mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = {
    mongoose
};