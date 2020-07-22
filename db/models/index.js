// jshint esversion:6
const { event, point, eventReq, guest } = require('./event.model');
const { user, friendRequest, friend, notifications } = require('./user.model');
const { convos, message } = require('./chat.model');
const { emailPin } = require('./emailPin.model');

module.exports = {
    event,
    point,
    eventReq,
    guest,
    user,
    notifications,
    friend,
    friendRequest,
    convos,
    message,
    emailPin,
};