const mongoose = require('mongoose');
require('dotenv').config();

mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://CEO_Lito:Dtgfu1314!@maindb-vbe1p.mongodb.net/MainDB?retryWrites=true&w=majority", { useNewUrlParser: true}).then(() => {
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