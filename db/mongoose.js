const mongoose = require('mongoose');
require('dotenv').config();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true}).then(() => {
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