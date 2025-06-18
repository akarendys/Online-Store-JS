const { body, validationResult } = require('express-validator');
const Offer = require('../models/offer');
const Item = require('../models/item');
const User = require('../models/user');

// Make an offer
exports.makeOffer = [
  body('amount').trim().isCurrency().withMessage('Invalid offer amount.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg).join(' '));
      return res.redirect(req.get('Referrer') || '/');
    }

    try {
      const { itemId } = req.params;
      const { amount } = req.body;
      const userId = req.session.userId; // Assuming you are using session for user authentication

      if (!userId) {
        return res.redirect('/login');
      }

      const item = await Item.findById(itemId).populate('user');
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      if (item.user._id.equals(userId)) {
        return res.status(401).render('401', { message: 'Cannot make an offer on your own item' });
      }

      const offer = new Offer({
        amount,
        user: userId,
        item: itemId
      });

      await offer.save();

      // Update item with totalOffers and highestOffer
      await Item.findByIdAndUpdate(itemId, {
        $inc: { totalOffers: 1 },
        $max: { highestOffer: amount }
      });

      res.redirect(`/items/${itemId}`); // Redirect back to item details page
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
];

// View all offers received on an item
exports.viewOffers = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view offers on this item' });
    }

    const offers = await Offer.find({ item: itemId }).populate('user', 'username');
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept an offer
exports.acceptOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const itemId = req.params.itemId;

    // Find the offer and item
    const offer = await Offer.findById(offerId).populate('item');
    const item = await Item.findById(itemId);

    if (!offer || !item) {
      return res.status(404).render('error', { message: 'Offer or item not found' });
    }

    // Check if the logged-in user is the owner of the item
    if (!req.session.userId || !item.user.equals(req.session.userId)) {
      return res.status(401).render('error', { message: 'Unauthorized' });
    }

    // Set the item to inactive
    item.active = false;
    await item.save();

    // Update the status of the accepted offer
    offer.status = 'accepted';
    await offer.save();

    // Update the status of the rest of the offers to 'rejected'
    await Offer.updateMany({ item: itemId, _id: { $ne: offerId } }, { status: 'rejected' });

    req.flash('success', 'Offer accepted successfully!');
    res.redirect(`/items/${itemId}/offers`);
  } catch (error) {
    console.log("Accept Offer Error:", error);
    res.status(500).render('error', { message: 'Server error' });
  }
};