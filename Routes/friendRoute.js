//jshint esversion:8
const express = require('express');
const friendRoute = express.Router();
const { user, friendRequest, friend, notifications } = require('../db/models');
const requireAuth = require('../middleware/requireAuth');

friendRoute.get('/', function (req, res) {
    res.status(200).send('Made it to friends endpoints');
});

friendRoute.post('/add', async(req, res) => {
      /** 
     *  INPUT: 
     *      req.body.sender = username of request sender
     *      req.body.receiver = username of request receiver
     * 
     * 
     *  OPERATIONS:
     *      1: parse res for sender/receiver usernames
     *      2: Find two users in DB that (A) match sender/reciever username and 
     *          (B) Do not have receiver/sender usernames inside of friendRequests subdocument
     *      3: Return 404 if two users are not found
     *      4: If two users are found 
     *      5: Create new friendRequest subdocument for each. Save to friendRequests array
     * 
     */   

    const USER_SENDING_FRIEND_REQUEST = req.body.sender; // sender username
    const USER_RECEIVING_FRIEND_REQUEST = req.body.receiver; // receiver username

     // Find two users that do NOT contain each other's username in friendRequests 

    const receivingUser = await user.findOne({
        username: USER_RECEIVING_FRIEND_REQUEST,
        "friendRequests.username": {$ne: USER_SENDING_FRIEND_REQUEST }
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;   
        }
    });

    const sendingUser = await user.findOne({
        username: USER_SENDING_FRIEND_REQUEST,
        "friendRequests.username": {$ne: USER_RECEIVING_FRIEND_REQUEST }
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });

    if (!sendingUser || !receivingUser){
        res.sendStatus(400);
        return;
    }

     let receiveRequest = new friendRequest({
        username: sendingUser.username,
        requestType: "received",
        userID: sendingUser._id
    });

    let sendRequest = new friendRequest({
        username: receivingUser.username,
        requestType: "sent",
        userID: receivingUser._id,

    })

    receivingUser.updateOne({ 
        $push: { 
            friendRequests: receiveRequest
        }
    }).then((accepting) => {

    });
        // not sure why i need a .then to make this work 

    sendingUser.updateOne({
        $push: { friendRequests: sendRequest}
    }).then((sending) => {
        // TODO err
    });  

    res.status(200).send("sent request");
});






    // TODO remove these functions
    // receivingUser.receiveFriendRequest(sendingUser.username);
    // sendingUser.sendFriendRequest(receivingUser.username)


friendRoute.post('/accept',requireAuth, async(req, res) => {
    const USER_WHO_SENT_FRIEND_REQUEST = req.body.sender; // user who sent the request 
    const USER_ACCEPTING_FRIEND_REQUEST = req.body.accepter; // user accepting the request
   
    // /** 
    //  *  INPUT: 
    //  *      req.body.sender = username of request sender
    //  *      req.body.accepter = username of request accepter
    //  * 
    //  * 
    //  *  OPERATIONS:
    //  *      1: parse res for sender/receiver usernames
    //  *      2: Find two users in DB that (A) match sender/reciever username and 
    //  *          (B) have receiver/sender usernames inside of friendRequests subdocument
    //  *      3: Return 404 if two users are not found
    //  *      4: If two users are found 
    //  *      5: Add sender/accepter username to accepter/sender friendArray
    //  * 
    //  */   

    let acceptingUser = await user.findOne({ 
        username: USER_ACCEPTING_FRIEND_REQUEST,
        "friendRequests.username": USER_WHO_SENT_FRIEND_REQUEST 
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });

    let sendingUser = await user.findOne({
        username: USER_WHO_SENT_FRIEND_REQUEST,
        "friendRequests.username": USER_ACCEPTING_FRIEND_REQUEST
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });

    if (!sendingUser || !acceptingUser){
        res.sendStatus(404);
        return;
    }

    const sendingFriend = new friend({
        username: sendingUser.username,
        userID: sendingUser._id
    });

    let userFriends = []
    for(let i=0; i < acceptingUser.friendsArray.length; i++){
        userFriends.push(acceptingUser.friendsArray[i].user)
    }

    if(userFriends.includes(sendingUser.username)){
        res.sendStatus(500);
        return
    }

    acceptingUser.updateOne({ //
        $pull: { friendRequests: {username: sendingUser.username} },
        $push: { friendsArray: sendingFriend}
    }).then((accepting) => {

    });
        // not sure why i need a .then to make this work 

    const acceptingFriend = new friend({
        username: acceptingUser.username,
        userID: acceptingUser._id
    });

    // notifying original sender that other user has accepted their friend request
    const goodNews = new notifications({
        username: acceptingUser.username,
        userID: acceptingUser._id,
        requestType: 'NewFriend'
    })

    // user who originally sent friend request
    sendingUser.updateOne({
        $pull: { friendRequests: {username: acceptingUser.username} },
        $push: { friendsArray: acceptingFriend, notifications: goodNews}
    }).then((sending) => {       
        // TODO err
    });

    res.status(200).send("Accepted Friend request from " + USER_WHO_SENT_FRIEND_REQUEST )
    
});





friendRoute.post('/remove',requireAuth, async(req, res) => {
    console.log(req)
    let userRemovingFriend = req.body.user; // user that is being deleting someone from friends list
    let userRemovedFriend = req.body.deletedUser; // user being deleted

    let deletingUser = await user.findOne({
        username: userRemovingFriend
       // "friendsArray.username":userRemovedFriend
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });

    let deletedUser = await user.findOne({
        username: userRemovedFriend
      //  "friendsArray.username": userRemovingFriend
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });

    if (!deletingUser || !deletedUser){
        res.sendStatus(404);
        return;
    }

    deletingUser.updateOne({
        $pull: { friendsArray:{username: deletedUser.username}}
    }).then((deleting) => {

    });
        // not sure why i need a .then to make this work 

    deletedUser.updateOne({
        $pull: { friendsArray:{username: deletingUser.username}}
    }).then((deleted) => {

    });

    res.status(200).send("deleted");

});




friendRoute.post('/reject', requireAuth, async(req, res) => {

    let USER_REJECTING_A_FRIEND_REQUEST = req.body.user; // username of user who is rejecting a friend request
    let USER_BEING_REJECTED = req.body.deletedUser; // username of user who's friend request is being rejected

    const rejectingUser = await user.findOne({
        username: USER_REJECTING_A_FRIEND_REQUEST,
        "friendRequests.username": USER_BEING_REJECTED
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });

    const rejectedUser = await user.findOne({
        username: USER_BEING_REJECTED,
        "friendRequests.username": USER_REJECTING_A_FRIEND_REQUEST
    }, function (err) {
        if (err) {
            res.sendStatus(500);
            return;
        }
    });
    
    if (!rejectingUser || !rejectedUser){
        res.sendStatus(404);
        return;
    }

    rejectingUser.updateOne({
        $pull: { friendRequests: {username: rejectedUser.username} },
    }).then((accepting) => {

    });
        // not sure why i need a .then to make this work 

    rejectedUser.updateOne({
        $pull: { friendRequests: {username: rejectingUser.username} },
    }).then((sending) => {

    });

    res.sendStatus(200);

});



module.exports = friendRoute;