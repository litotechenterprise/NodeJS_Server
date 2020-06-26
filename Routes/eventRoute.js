//jshint esversion: 8
const express = require('express');
const eventRouter = express.Router();
const { event, point, user, eventReq, guest, notifications } = require('../db/models');
const requireAuth = require('../middleware/requireAuth');

// Creating a new Event
eventRouter.post('/create',requireAuth, async(req, res) => {
  
    try {  
        let newEvent = new event({
            title: req.body.title,
            location: new point({
                type: "Point",
                coordinates: req.body.coordinates
            }),
            description: req.body.description,
            toWhere: req.body.toWhere,
            privacy: req.body.privacy,
            createdAt: Date.now(),
            owner: req.user._id,
            username: req.user.username
        });

        
        await newEvent.save()
        res.status(200).send(newEvent)

    } catch(err) {
        return res.status(422).send(err.message);
    }
    
});

// find a specific event
eventRouter.route("/:id")
    .get(requireAuth, async (req, res) => {
        const _id = req.params.id

        try {
        const foundEvent  = await event.findByID({_id})

        if (!foundEvent) {
            return res.status(404).send({'error':'Cannot find this event'})
        }

        res.status(200).send(foundEvent)

        } catch(e) {
            res.status(500).send()
        }
    })

// requesting permission to attend certain event
eventRouter.post('/ask',requireAuth, async(req, res) => {
    const EventID = req.body.eventID; // Event ID
    const User_asking = req.body.userRequesting; // sending username
    
    // finding event
    const foundEvent  = await event.findOne({
        _id: EventID
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    })
    // Finding User
    const foundUser = await user.findOne({
        username: User_asking,
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });
    // checking to see if any are null
    if(!foundEvent|| !foundUser){
        res.sendStatus(400);
        return;
    }

    let attendanceRequest = new eventReq({
        username: foundUser.username,
        userID: foundUser._id,
        message: req.body.msg,
        eventDescription: foundEvent.description,
        eventID: foundEvent._id
    });

    console.log(foundEvent.eventRequests)

    foundEvent.updateOne({ 
        $push: { 
            eventRequests: attendanceRequest
        }
    }).then((accepting) => {

    });
        // not sure why i need a .then to make this work 

    res.send('sent ask')

});

// Reject user request to come to your event
eventRouter.post('/reject', requireAuth, async(req,res) => {

    const EventID = req.body.eventID; // Event ID
    const User_Being_Rejected = req.body.username; // sending username

    try {
        const foundEvent  = await event.findOne({
            _id: EventID
        }, function (err) {
            if (err) {
                res.sendStatus(500);
                return;
            }
        })
        
        foundEvent.updateOne({
            $pull: { eventRequests: {username: User_Being_Rejected} }
        }).then((rejecting) => {

        });

    } catch (e) {
        console.log(e)
        res.send(e)
    }
        res.send("rejected")
})



// Accepting user request to come to your event
eventRouter.post('/accept', requireAuth, async(req,res) => {

    const EventID = req.body.eventID; // Event ID
    const User_Being_Accepted = req.body.username; // sending username

    try {
        const foundEvent  = await event.findOne({ // find event
            _id: EventID
        }, function (err) {
            if (err) {
                res.sendStatus(500);
                return;
            }
        })

        const foundUser = await user.findOne({ // find user 
            username: User_Being_Accepted,
        }, function (err) {
            if (err) {
                res.sendStatus(500);
                return;
            }
        });

        // seeing if user is alread on the guestlist
        for(let i=0; i < foundEvent.guestList.length; i++){
            if(foundEvent.guestList[i].username === foundUser.username){
                res.sendStatus(500);
                return;
            }
        }

        const NewGuest = new guest({
            guestname: foundUser.username,
            guestID: foundUser._id
        })

        // adding user to the guest list
        foundEvent.updateOne({
            $pull: { eventRequests: {username: User_Being_Accepted} },
            $push: { guestList: NewGuest}
        }).then((accepting) => {

        });

        console.log(foundEvent.location.coordinates)


        const goodNews = new notifications({
            username: foundEvent.username,
            requestType: 'Accepted',
            userID: foundEvent.owner,
            message:foundEvent.location.coordinates
        })

        foundUser.updateOne({
            $push: { notifications: goodNews}
        }).then((accepting) => {

        })

    } catch (e) {
        console.log(e)
        res.send(e)
    }
        res.send("accepted")
})

// adding someone to the guestlist
eventRouter.post('/added', requireAuth, async(req,res) => {

    const EventID = req.body.eventID; // Event ID
    const User_Being_Added = req.body.username; // sending username

    try {
        const foundEvent  = await event.findOne({
            _id: EventID
        }, function (err) {
            if (err) {
                res.sendStatus(500);
                return;
            }
        })

        let GuestListNames = []

        for(i=0; i<foundEvent.guestList.length;i++) {
            GuestListNames.push(foundEvent.guestList[i].guestname)
        }

        if(GuestListNames.includes(User_Being_Added) || foundEvent.username == User_Being_Added){
            return res.send("already added") 
        }

        const foundUser = await user.findOne({
            username: User_Being_Added,
        }, function (err) {
            if (err) {
                res.sendStatus(500);
                return;
            }
        });

        const NewGuest = new guest({
            guestname: foundUser.username,
            guestID: foundUser._id
        })

        foundEvent.updateOne({
            $push: { guestList: NewGuest}
        }).then((accepting) => {

        });

    } catch (e) {
        console.log(e)
        res.send(e)
    }
        res.send("added")
})

// Geting all events created by current user
eventRouter.get('/my/events',requireAuth, async(req, res) => {
    try {  
        const myEvents = await event.find({owner:req.user._id}).sort({ createdAt: 'desc' });
        res.status(200).send(myEvents);

    } catch(err) {
        return res.status(422).send(err.message);
    }
    
});


eventRouter.delete('/delete/event', requireAuth, async(req,res) => {
    try {
        
    const foundEvent  = await event.findOneAndDelete({_id: req.body.eventId, owner: req.user._id})

    if (!foundEvent) {
        return res.status(404).send({'error':'Cannot find this event'})
    }

    res.status(200).send("This Event has been cancelled!")
     
    } catch(err) {
        console.log(err)
        res.status(500).send()
    }
})

// current user getting certain event created by current user
eventRouter.route('/my/events/:id')
    .get(requireAuth, async (req,res) => {
        const _id = req.body.eventId

        try {
        const foundEvent  = await event.findOne({_id, owner: req.user._id})

        if (!foundEvent) {
            return res.status(404).send({'error':'Cannot find this event'})
        }

        res.status(200).send(foundEvent)

        } catch(e) {
            res.status(500).send()
        }
    })


    // deleting event that user created
    // finding event by ID
    .delete(requireAuth, async (req,res) => {
        const _id = req.params.id

        try {
        const foundEvent  = await event.findOneAndDelete({_id, owner: req.user._id})

        if (!foundEvent) {
            return res.status(404).send({'error':'Cannot find this event'})
        }

        res.status(200).send("This Event has been cancelled!")

        } catch(e) {
            res.status(500).send()
        }
    })


module.exports = eventRouter;