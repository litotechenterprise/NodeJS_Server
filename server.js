// deploying mongoDB
require('./db/mongoose')
var express = require('express');
var app = express();
const PORT = process.env.PORT || 8081;
const bodyParser = require('body-parser');
const socketio = require('socket.io')
const http = require('http')
const sessions = require('express-session');
const {eventRoute, userRoute, friendRoute, feedRoute, convoRoute} = require('./Routes');

app.use(bodyParser.json());




app.get('/', (req,res) => {
    res.send('Welcome to the GreenLinks API')
})
app.use('/events', eventRoute);
app.use('/feed', feedRoute);
app.use('/user', userRoute);
app.use('/friends', friendRoute);



///  SOCKET.IO
const server = http.createServer(app)
server.listen(PORT, function(){
  console.log('Server is runing on PORT:', PORT);
});
const io = socketio(server)
convoRoute(app, io);