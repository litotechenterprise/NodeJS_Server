//jshint esversion: 8
require('dotenv').config();
const express = require('express');
const UserRoute = express.Router();
const { user, point, event, notifications} = require('../db/models');
const bcrypt = require('bcrypt');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/requireAuth');
const sharp = require('sharp');
const { has } = require('lodash');

//getting all users!
UserRoute.route("/get")
   .get(requireAuth, async(req,res) => {

      //let searchFoUser = req.body.username
      //let searchFoUser = req.query.username;
      try{
         const users = await user.find({})
         res.status(200).send(users);
      }catch (err) {
         res.status(404).send("cant find User")
      }
});

UserRoute.route("/currentUser")

   // getting current user info
   .get(requireAuth, async(req,res) => {
      res.send(req.user);
   })
   
   // updating a current user
   .patch(requireAuth, async (req, res) => {
      
      const updates = Object.keys(req.body)
      const allowedToBeUpdated = [ 'bio', 'email'];
      const validUpdate = updates.every((update) => allowedToBeUpdated.includes(update));

      if(!validUpdate) {
         return res.status(400).send({'error':"invalid Update"});
      }
      
      try {
         updates.forEach((update) => req.user[update] = req.body[update])
         await req.user.save()

         res.status(200).send(req.user)
      } catch(e) {
         res.status(400).send();
      }
   })

    //deleting current user =(
   .delete(requireAuth, async (req, res) => {
      try {
         // delete all request that the user created
        await event.deleteMany({owner: req.user._id}) 
        await req.user.remove();
        res.status(200).send("Good bye " + req.user.username);
      } catch(e) {
         res.status(500).send('Error');
      }
   });

UserRoute.patch('/change/password', requireAuth, async(req,res) => {
   let currentUser = req.user

   const isMatch = await bcrypt.compare(req.body.oldPassword, currentUser.password);
   // passords dont match up
   if(!isMatch){
      return res.status(400).send({'error':'Your old password doesnt match'})
   }

   await bcrypt.hash(req.body.newPassword, 10, async (err, hash) => {
      currentUser.password = hash
      await currentUser.save()

      return res.status(200).send('Changed Password')
   })


})


UserRoute.route('/:id')
   // getting a certain user by their ID
   .get(requireAuth, async (req, res) => {
      const _id = req.params.id;
      try {
        const foundUser = await user.findById(_id)
        if(!foundUser) {
           return res.status(404).send({"error":"User not found"});
        }
        
        const friends = areFriends(foundUser.friendsArray,req.user.username)
        const isYou = yourself(foundUser.username, req.user.username)
        res.status(200).send({foundUser, friends, isYou})
      } catch(e) {
         res.status(500).send();
      }
});

function yourself(user1, user2){
   if(user1 != user2){
      return false
   } else {
      return true
   }
}


function areFriends(array, usernameKey){
   for (var i=0; i < array.length; i++) {
      if (array[i].username === usernameKey) {
          return true;
      } 
   }
   
   return false;
}




// getting Username by ID
UserRoute.route('/:id/username')
   .get(requireAuth, async (req, res) => {
      const _id = req.params.id;
      try {
        const foundUser = await user.findById(_id)
        if(!foundUser) {
           return res.status(404).send({"error":"User not found"});
        }
        res.status(200).send(foundUser.username)
      } catch(e) {
         res.status(500).send();
      }
});

// getting current user Friends Array AKA returning friends of user
UserRoute.get('/get/friends',requireAuth, (req,res) => {
    res.status(200).send(req.user.friendsArray)
})


// NOTIFICICATIONS
UserRoute.get('/get/note',requireAuth, async (req,res) => {
   User = req.user

   // getting all friend request
   const FriendRequestNotificiations = await User.friendRequests
   var requestNotifications =  FriendRequestNotificiations.filter(function(Notificiation) {
      return Notificiation.requestType ===  'received';
   });

   // getting all event requst
   const myEvents = await event.find({owner:req.user._id}).sort({ createdAt: 'desc' });
   let EventNote = []
   for(var i=0; i< myEvents.length; i++){
      for(var j=0; j<myEvents[i].eventRequests.length; j++){
         EventNote.push(myEvents[i].eventRequests[j])
      }
   }

   const Notificiations = await User.notifications

   // combining all arrays
   const NotificationArray = [...requestNotifications, ...EventNote, ...Notificiations]
   // sorting by date
   NotificationArray.sort((a, b) => {
      if (a.createdAt > b.createdAt){
         return -1
      } else {
         return 1
      }
   })   
   
   res.send(NotificationArray)
})

// Notifications count
UserRoute.get('/get/note/count',requireAuth, async (req,res) => {
   User = req.user
   const FriendRequestNotificiations = await User.friendRequests
   var requestNotifications =  FriendRequestNotificiations.filter(function(Notificiation) {
      return Notificiation.requestType ==  'received';
   });

   const myEvents = await event.find({owner:req.user._id}).sort({ createdAt: 'desc' });
   let EventNote = []
   for(var i=0; i< myEvents.length; i++){
      for(var j=0; j<myEvents[i].eventRequests.length; j++){
         EventNote.push(myEvents[i].eventRequests[j])
      }
   }

   const Notificiations = await User.notifications

   const NotificationArray = [...requestNotifications, ...EventNote, ...Notificiations]


   const count = NotificationArray.length
   res.send({count})
})

UserRoute.post('/dismiss/note', requireAuth, async(req,res) => {
   
})

UserRoute.post('/add/recent', requireAuth, async(req,res) => {
   try{
      for(let i=0; i<req.user.recentlyViewed.length;i++){
         if(req.user.recentlyViewed[i] === req.body.EventId){
            res.send("already added")
            return
         }
      }
      req.user.recentlyViewed = req.user.recentlyViewed.concat(req.body.EventId)
      await req.user.save()
      res.send("added")
   } catch(err) {
      console.log(err)
   }
  
})

UserRoute.get('/get/recents', requireAuth, async(req,res) => {
   try{
      let recentEvents = []
      let max = req.user.recentlyViewed.length
      if(req.user.recentlyViewed.length > 15){
         max = 15
      }
      const recentList = req.user.recentlyViewed.reverse()
      for(let i=0; i < max; i++){
         const Event = await event.findOne({_id:recentList[i]})
         if(!Event){
            res.status(500)
            return
         }
         recentEvents.push(Event)
      }
      res.status(200).send(recentEvents)
   } catch(err) {

   }
})


// AUTHENTICATION
UserRoute.route('/create')
   .post(async (req,res) => {
      try {
         await bcrypt.hash(req.body.password, 10, async (err, hash) => {
            let newUser = new user({
               username: req.body.username,
               email: req.body.email,
               password:hash,
               firstName:req.body.firstName,
               lastName:req.body.lastName,
               bio: req.body.bio,
               refreshFFeed: Date.now(),
               refreshCFeed: Date.now(),
           });
            const token = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY || "Secret");
            newUser.tokens = newUser.tokens.concat({token});
            await newUser.save()
            const ID = newUser._id
            const username = newUser.username
            res.status(200).send({token, ID, username});      
         })
      } catch(err) {
         console.log(err.message)
         res.status(404).send(err.message);
      }
   })


UserRoute.route('/login')
   .post(async (req,res) => {
      const username = req.body.username;
      const password = req.body.password;

      try {
         const User = await user.findOne({username});
         if (!User){
            // return res.status(404).send({'error':'User is not found'})
            return res.sendStatus(404)
         }
         const isMatch = await bcrypt.compare(password, User.password);
         // passords dont match up
         if(!isMatch){
            return res.status(400).send({'error':'Password is invaid'})
         }

         // if(User.tokens.length > 0) {
         //    return res.status(409).send({'error':'User is already logged in somewhere else'})
         // }
         const token =  jwt.sign({ userId: User._id }, process.env.SECRET_KEY || "Secret");
         User.tokens = User.tokens.concat({token})
         await User.save()
         const ID = User._id
         const currentUsername = User.username
         return res.status(200).send({token,ID,currentUsername });

      } catch(e) {
         res.status(500).send()
      }
});

UserRoute.post('/logout', requireAuth, async (req, res) => {
   try {
         req.user.tokens = [];
         await req.user.save()
         res.status(200).send("Logged Out");
   } catch (e) {
         console.log(e.message)
         console.log("Error while logging out")
         res.status(500).send("Error while logging out")
   }
});




// PROFILE PICTURE AND PHOTOS
const upload = multer({
   limits: {
      fileSize:10000000
   },
   fileFilter(req,file,cb) {
      if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
         cb(new Error('Please upload an image'))
      }

      cb(undefined, true)
   }
})



UserRoute.route('/profilePic')
   .post(requireAuth, upload.single('upload'), async(req,res) => {
      const buffer = await sharp(req.file.buffer).resize({width:200,height:200}).png().toBuffer()

      req.user.profilePic = buffer
      req.user.save()
      res.send()

   }, (error, req,res,next) => {
      res.status(400).send({error:error.message})
   })

   .patch(requireAuth,upload.single('upload'), async(req,res) => {
      const buffer = await sharp(req.file.buffer).resize({width:200,height:200}).png().toBuffer()
   
      req.user.profilePic = buffer
      req.user.save()
      res.send()

      }, (error, req,res,next) => {
         res.status(400).send({error:error.message})
      })

   .delete(requireAuth, async(req,res) => {
         req.user.profilePic = undefined
         await req.user.save()
         res.send()
   })



UserRoute.get('/:id/profilePic', async (req,res) => {
   try {
      const User = await user.findById(req.params.id)
      res.set('Content-Type', 'image/png')
      res.send(User.profilePic)

   }catch(err) {
      res.status(404).send()
   }
   
})




module.exports = UserRoute;