const mongoose = require('mongoose')
const { user, convos, message } = require('../db/models');
const requireAuth = require('../middleware/requireAuth');


const Conversations = async (app, io) => {
    // getting all of users conversations
    app.get('/convos', requireAuth, async (req,res) => {
            const Convos = await convos.find({
                participants: { $size: 2},
                "participants.userID": req.user._id,
                messages:{ $ne: [] }
            }).sort({ updatedAt: 'desc' })
            res.status(200).send(Convos);
    })

    app.post('/convos/btw/2Users', requireAuth, async (req,res) => {

        const Convos = await convos.findOne({
            "participants.userID": req.user._id,
            "participants.userID": req.body.userID
        })

        if(Convos){
            return res.status(200).send(Convos._id)
        } 

        const currentUser = {
            "userID": req.user._id.toString(),
            "username": req.user.username,
        }

        try {
            const newConvo = new convos({
                participants:[currentUser, req.body]
            })

            await newConvo.save()
            return res.status(200).send(newConvo._id)

        } catch(e) {
            console.log(e)
            res.sendStatus(400);
        }
        
    })

    // To route to create a new conversation
    app.post("/convos/new", requireAuth, async(req, res) => {
      
        const currentUser= req.body.sender

        const otherUser = req.body.recevier

        try {
                const newConvo = new convos({
                    participants:[currentUser, otherUser]
                })
                await newConvo.save()
                 res.status(200).send(newConvo)
        } catch(e) {
            console.log(e)
            res.sendStatus(400);
        }
    })

   

  
    const users = {}


     // Using Socket.io
    io.on('connection', (socket) => {

        socket.on('disconnect', () => {
            delete users[socket.id]
        })

        socket.on("action" , async action => {
            switch(action.type) {
                case "server/join":
                    // join room
                    
                    socket.join(action.data.room)

                    // get messaging data and save it to the local state on the phone
                    const Convo  =  await convos.findOne({_id: action.data.room});
                    const messages = Convo.messages.reverse()
                    socket.emit("action", {
                        type: "get_Messages",
                            data: {
                            messages:messages,
                            conversationId: action.data.room
                        }
                     })

                    break
                case "server/private_message":
                     //const conversationId = action.data.conversationId
                     const room = action.data.chatroom
                     //const from = users[socket.id].ID
                    //  const userValues = Object.values(users)
                     //const socketIds = Object.keys(users)
                     const message = {
                         //_id:uuidv4(),
                         text:action.data.message.text,
                         user:action.data.message.user
                     }
                     
                     await convos.updateOne({_id: room},{$push : {messages:message}}).then(() => console.log("Save to Mongodb"))
                     //socket.broadcast.to(room)
                     socket.broadcast.to(room).emit("action", {
                        type: "private_message",
                            data: {
                            ...action.data,
                            conversationId: room
                        }
                     })
                    //  for(let i=0; i < userValues.length; i++){
                    //      if (userValues[i].ID == conversationId){
                    //          const socketId = socketIds[i]
                             
                    //          io.sockets.sockets[socketId].emit("action", {
                    //              type: "private_message",
                    //              data: {
                    //                 ...action.data,
                    //                 conversationId: room
                    //              }
                    //          })
                    //      }
                    //  }

                     break
            }
        }) 
        
    })

}


module.exports = Conversations