const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const itemController = require('../controllers/itemController');
const offerRoutes = require('./offerRoutes');
const auth = require('../middlewares/auth'); 

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/search', itemController.searchItems);

// Logged-in user routes for item creation
router.get('/items/new', auth.isLoggedIn, itemController.getNewItemForm);
router.post('/items/:id/edit', auth.isLoggedIn, auth.isOwner, upload.single('image'), itemController.updateItem);

// Public routes
router.get('/items', itemController.getAllItems);
router.get('/items/:id', itemController.getItemDetails);

// Owner-only routes for item edit and delete
router.get('/items/:id/edit', auth.isLoggedIn, auth.isOwner, itemController.getEditItemForm);
router.post('/items/:id/edit', auth.isLoggedIn, auth.isOwner, itemController.updateItem);
router.post('/items/:id/delete', auth.isLoggedIn, auth.isOwner, itemController.deleteItem);

// Add a route to view offers for a specific item
router.get('/items/:id/offers', auth.isLoggedIn, auth.isOwner, itemController.getItemOffers);

// Route to add a review
router.post('/items/:id/reviews', auth.isLoggedIn, itemController.addReview);

// Nest offer routes
router.use('/items/:itemId/offers', auth.isLoggedIn, offerRoutes);

module.exports = router;
