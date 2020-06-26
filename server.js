// deploying mongoDB
require('./db/mongoose');

var express = require('express');
var app = express();
const PORT = process.env.PORT || 8081;
const bodyParser = require('body-parser');
app.use(bodyParser.json());


app.get('/', (req,res) => {
    res.send('Welcome to the GreenLinks API')
  })


app.listen(PORT, () => {
    console.log("Listening to port " + PORT)
})