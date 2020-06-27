// deploying mongoDB
var express = require('express');
var app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
//require('./db/mongoose.js')
const connectToDatabase = require('./db/db')
const { user} = require('../db/models');

app.use(bodyParser.json());
// const sessions = require('express-session');
// app.use(sessions({
//   secret:' SECRETKEY',
//   resave:false,
//   saveUninitialized:false,
// }))

app.get('/', async (req,res) => {
    await connectToDatabase()
    const users = await user.find({})
    res.status(200).send(users);
})
// app.listen(PORT, function(){
//   console.log("listening on port "+PORT)
// })

// const {eventRoute, userRoute, friendRoute, feedRoute, convoRoute} = require('./Routes');
// app.use('/events', eventRoute);
// app.use('/feed', feedRoute);
// app.use('/user', userRoute);
// app.use('/friends', friendRoute);

const http = require('http')
http.createServer(app).listen(PORT, function() {
  console.log("listening on port " + PORT)
})
// const socketio = require('socket.io')
// //  SOCKET.IO
// const server = http.createServer(app)
// server.listen(PORT, function(){
//   console.log('Server is runing on PORT:', PORT);
// });
// const io = socketio(server)
// convoRoute(app, io);
