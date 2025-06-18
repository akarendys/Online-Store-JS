const User = require('../models/user');
const Item = require('../models/item');

// Middleware to check if user is logged in
exports.isLoggedIn = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.log("Auth Error:", error);
    }
  }
  res.status(401).redirect('/login');
};

// Check if user is a guest (not logged in)
exports.isGuest = (req, res, next) => {
  if (!req.session.userId) {
    return next();
  }
  res.redirect('/');
};

// Check if user is the owner of the item
exports.isOwner = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id || req.params.itemId).populate('user');
    if (item && item.user._id.equals(req.session.userId)) {
      return next();
    }
  } catch (error) {
    console.log("Auth Error:", error);
  }
  res.status(403).redirect('/');
};

