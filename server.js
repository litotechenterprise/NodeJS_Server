// deploying mongoDB
var express = require('express');
var app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
//require('./db/mongoose.js')


app.use(bodyParser.json());
// const sessions = require('express-session');
// app.use(sessions({
//   secret:' SECRETKEY',
//   resave:false,
//   saveUninitialized:false,
// }))

app.get('/', (req,res) => {
    res.send('Welcome to the GreenLinks API from lito')
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
