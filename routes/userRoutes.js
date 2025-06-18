const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// Guest-only routes
router.get('/signup', auth.isGuest, userController.getSignupForm);
router.post('/signup', auth.isGuest, userController.signup);
router.get('/login', auth.isGuest, userController.getLoginForm);
router.post('/login', auth.isGuest, userController.login);

// Logged-in user routes
router.get('/profile', auth.isLoggedIn, userController.profile);
router.post('/logout', auth.isLoggedIn, userController.logout);

module.exports = router;
