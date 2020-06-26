//jshint esversion: 8
const express = require('express');
const feedRouter = express.Router();
const { event, point, user } = require('../db/models');
const requireAuth = require('../middleware/requireAuth');


// getting user feed!
feedRouter.get('/friends',requireAuth, async(req, res) => {

    let thisUser = req.user
    let range = req.query.searchRange; 
    let center = req.query.coordinates
    if (!center || !range) {
         center = req.body.coordinates;     
    }

    let divisor = 3963.2; // radans of the earth
    let radius = range / divisor;
    let friendsArrayNames = []

    // creating an array of names that only hold the STR values of the names
    // thisUser.friendsArray return a array of objects 
    for(i=0; i<thisUser.friendsArray.length;i++){
        friendsArrayNames.push(thisUser.friendsArray[i].username)
    }

    // making sure that your post are apart of the firends feed
    friendsArrayNames.push(thisUser.username)

    try{
        const events = await event.find({
            username: { $in: friendsArrayNames},
            toWhere: "friends",
            "location.coordinates": {
                $geoWithin:
                {
                     $centerSphere: [center, radius]
                }
            },
            //createdAt : {$gte: thisUser.refreshFFeed},
        }).sort({ createdAt: 'desc' })


        thisUser.refreshFFeed = Date.now();
        await thisUser.save();
        res.status(200).send(events);
      

    }catch (err) {
        console.log(err)
        res.status(500).send(err);
    }
   
});


/// I want anyone to be able to view the community feed but they will not be able to interact with the feed 
// i think we should persent the community feed on our website grabing their location so people are able to see 
// what's going on around them. enticing them to create an account
feedRouter.get('/community',requireAuth, async(req, res) => {

    let thisUser = req.user
    let range = req.query.searchRange; 
    let center = req.query.coordinates
    if (!center || !range) {
         center = req.body.coordinates;
         range = 5; 
    }


    let divisor = 3963.2; // radans of the earth
    let radius = range / divisor;

    try{
        const events = await event.find({
            toWhere: "community", 
            "location.coordinates": {
                $geoWithin:
                {
                     $centerSphere: [center, radius]
                }
            },
            //createdAt : {$gte: thisUser.refreshCFeed},
            
        }).sort({ createdAt: 'desc' });

        thisUser.refreshCFeed = Date.now();
        await thisUser.save();
        res.status(200).send(events);
        
    }catch (err) {
        res.status(500).send(err);
    }

   

});

module.exports = feedRouter;