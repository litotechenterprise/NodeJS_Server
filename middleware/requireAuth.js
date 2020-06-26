require('dotenv').config();
const jwt = require('jsonwebtoken');
const {user} = require('../db/models');

const requireAuth = async (req,res,next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ','');
    const decoded = jwt.verify(token, process.env.SECRET_KEY || "Secret");
    const User = await user.findOne({_id: decoded.userId, 'tokens.token':token});
    
    if(!User){
      throw new Error();
    }
    
    req.user = User;
    next()
  } catch(e) {
      res.status(401).send({"error": "Please Login"})
  }
}

module.exports = requireAuth