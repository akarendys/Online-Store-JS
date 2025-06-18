const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Item = require('../models/item');
const Offer = require('../models/offer');
const Review = require('../models/review');

// Controller to display all items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ price: 1 }).populate('user');
    res.render('items/items', { items });
  } catch (err) {
    res.status(500).send('Error retrieving items from the database');
  }
};

exports.getItemDetails = async (req, res) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidObjectId) {
    return res.status(400).render('400', { message: 'Invalid Object ID' });
  }

  try {
    const item = await Item.findById(req.params.id).populate('user').populate({
      path: 'reviews',
      populate: { path: 'user', select: 'firstName lastName' }
    });

    if (item) {
      const averageRating = item.reviews.reduce((acc, review) => acc + review.rating, 0) / item.reviews.length || 0;
      res.render('items/itemDetail', { item, averageRating });
    } else {
      res.status(404).render('404', { message: 'Item not found' });
    }
  } catch (err) {
    res.status(500).send('Error retrieving item from the database');
  }
};

exports.getNewItemForm = (req, res) => {
  try {
    res.render('items/new');
  } catch (error) {
    console.log("Error rendering form:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.createNewItem = [
  body('title').trim().notEmpty().escape().withMessage('Title is required.'),
  body('condition').trim().isIn(['New', 'Used', 'Good', 'Fair', 'Poor']).withMessage('Invalid condition.'),
  body('price').trim().isCurrency().withMessage('Invalid price.'),
  body('details').trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg).join(' '));
      return res.redirect(req.get('Referrer') || '/');
    }

    try {
      const { title, condition, price, details } = req.body;
      const imagePath = req.file ? '/uploads/' + req.file.filename : '';

      if (!['New', 'Used', 'Good', 'Fair', 'Poor'].includes(condition)) {
        req.flash('error', 'Invalid condition.');
        return res.redirect(req.get('Referrer') || '/');
      }

      const newItem = new Item({
        title,
        condition,
        price,
        details,
        image: imagePath,
        active: true, // Automatically set status to active
        user: req.session.userId
      });

      await newItem.save();
      req.flash('success', 'Item created successfully!');
      res.redirect('/items');
    } catch (err) {
      if (err.name === 'ValidationError') {
        req.flash('error', 'Error creating item. Please check your input and try again.');
        return res.redirect(req.get('Referrer') || '/');
      }

      console.log("Create Item Error:", err);
      req.flash('error', 'An unexpected error occurred. Please try again.');
      res.redirect(req.get('Referrer') || '/');
    }
  }
];

exports.getEditItemForm = async (req, res) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isValidObjectId) {
    req.flash('error', 'Invalid item ID.');
    return res.redirect(req.get('Referrer') || '/');
  }

  try {
    const item = await Item.findById(req.params.id).populate('user');

    if (item) {
      res.render('items/editItem', { item, sellerName: `${item.user.firstName} ${item.user.lastName}` });
    } else {
      req.flash('error', 'Item not found.');
      res.redirect(req.get('Referrer') || '/');
    }
  } catch (err) {
    console.log("Error fetching item:", err);
    req.flash('error', 'An unexpected error occurred.');
    res.redirect(req.get('Referrer') || '/');
  }
};

exports.updateItem = [
  body('title').trim().notEmpty().escape().withMessage('Title is required.'),
  body('condition').trim().isIn(['new', 'used']).withMessage('Invalid condition.'),
  body('price').trim().isCurrency().withMessage('Invalid price.'),
  body('details').trim().escape(),
  async (req, res) => {
    console.log("Request Body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg).join(' '));
      return res.redirect(req.get('Referrer') || '/');
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    if (!isValidObjectId) {
      req.flash('error', 'Invalid item ID.');
      return res.redirect(req.get('Referrer') || '/');
    }

    try {
      const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existingImage || '';

      if (!['new', 'used'].includes(req.body.condition)) {
        req.flash('error', 'Invalid condition.');
        return res.redirect(req.get('Referrer') || '/');
      }

      const updatedItem = {
        title: req.body.title,
        condition: req.body.condition,
        price: parseFloat(req.body.price),
        details: req.body.details,
        image: imagePath,
        active: req.body.active === 'on',
        offersReceived: parseInt(req.body.offersReceived) || 0
      };

      const item = await Item.findByIdAndUpdate(req.params.id, updatedItem, { new: true, runValidators: true });

      if (item) {
        req.flash('success', 'Item updated successfully!');
        res.redirect(`/items/${item._id}`);
      } else {
        req.flash('error', 'Item not found.');
        res.redirect(req.get('Referrer') || '/');
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        req.flash('error', 'Error updating item. Please check your input and try again.');
        return res.redirect(req.get('Referrer') || '/');
      }

      console.log("Update Error:", err.message);
      req.flash('error', 'An unexpected error occurred. Please try again.');
      res.redirect(req.get('Referrer') || '/');
    }
  }
];

exports.deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findByIdAndDelete(itemId);

    if (item) {
      await Offer.deleteMany({ item: itemId });
      req.flash('success', 'Item and associated offers deleted successfully!');
    } else {
      req.flash('error', 'Item not found.');
    }

    res.redirect('/items');
  } catch (err) {
    console.log("Delete Item Error:", err);
    req.flash('error', 'An unexpected error occurred while deleting the item.');
    res.redirect('/items');
  }
};

exports.searchItems = async (req, res) => {
  const searchTerm = req.query.q ? req.query.q.toLowerCase() : '';
  try {
    const searchResults = await Item.find({
      active: true,
      $or: [
        { title: new RegExp(searchTerm, 'i') },
        { details: new RegExp(searchTerm, 'i') }
      ]
    });
    res.render('items/items', { items: searchResults });
  } catch (err) {
    res.status(500).send('Error searching items in the database');
  }
};

exports.getItemOffers = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('user');
    if (!item) {
      return res.status(404).render('error', { message: 'Item not found' });
    }

    if (!req.session.userId || !item.user._id.equals(req.session.userId)) {
      return res.status(401).render('error', { message: 'Unauthorized' });
    }

    const offers = await Offer.find({ item: req.params.id }).populate('user');
    res.render('offers/offers', { item, offers });
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
};

exports.addReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
  body('comment').trim().notEmpty().withMessage('Comment is required.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg).join(' '));
      return res.redirect(req.get('Referrer') || '/');
    }

    try {
      const { rating, comment } = req.body;
      const userId = req.session.userId;
      const itemId = req.params.id;

      const review = new Review({
        rating,
        comment,
        user: userId,
        item: itemId
      });

      await review.save();

      await Item.findByIdAndUpdate(itemId, {
        $push: { reviews: review._id }
      });

      req.flash('success', 'Review added successfully!');
      res.redirect(`/items/${itemId}`);
    } catch (error) {
      console.log("Add Review Error:", error);
      req.flash('error', 'An unexpected error occurred. Please try again.');
      res.redirect(req.get('Referrer') || '/');
    }
  }
];
