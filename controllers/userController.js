const User = require('../models/user');  // Make sure your User model is correctly set up
const bcrypt = require('bcryptjs');
const Item = require('../models/item');
const Offer = require('../models/offer');

// Display signup form
exports.getSignupForm = (req, res) => {
    res.render('user/new');  // Render the registration view (new.ejs)
};

// userController.js
exports.signup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Check for empty fields
    if (!firstName || !lastName || !email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('back');
    }

    try {
        // Check if the email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email address has already been used.');
            return res.redirect('back');
        }

        // Create a new user
        const user = new User({ firstName, lastName, email, password });
        await user.save();

        req.flash('success', 'Account created successfully! You can now log in.');
        res.redirect('/login'); // Redirect to login with a success message
    } catch (err) {
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            req.flash('error', 'Signup failed. Please check your information and try again.');
            return res.redirect('back');
        }

        console.log("Signup Error:", err);
        req.flash('error', 'An unexpected error occurred. Please try again.');
        res.redirect('back');
    }
};

// Display login form
exports.getLoginForm = (req, res) => {
    res.render('user/login');  // Render the login view (login.ejs)
};

// userController.js
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Check for empty fields
    if (!email || !password) {
        req.flash('error', 'Email and password are required.');
        return res.redirect('back');
    }

    try {
        const user = await User.findOne({ email });

        // If user doesn't exist or password is incorrect
        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash('error', 'Incorrect email or password.');
            return res.redirect('back');
        }

        // Successful authentication
        req.session.userId = user._id;
        req.flash('success', 'Logged in successfully!');
        res.redirect('/profile');
    } catch (err) {
        console.log("Login Error:", err);
        req.flash('error', 'An unexpected error occurred. Please try again.');
        res.redirect('back');
    }
};

// Display user profile
exports.profile = async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        // Find all items associated with the logged-in user
        const items = await Item.find({ user: req.session.userId });
        const user = await User.findById(req.session.userId);
        const offers = await Offer.find({ user: req.session.userId }).populate('item');

        res.render('user/profile', { user, items, offers }); // Pass user, items, and offers to the view
    } catch (err) {
        console.log("Error fetching user profile:", err);
        req.flash('error', 'Error loading profile. Please try again.');
        res.redirect('/');
    }
};

// Handle user logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/profile');
        }
        res.clearCookie('connect.sid');
        res.redirect('/?success=Logged out successfully!'); // Redirect with success message
    });
};
