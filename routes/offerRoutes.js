const express = require('express');
const router = express.Router({ mergeParams: true });
const offerController = require('../controllers/offerController');
const auth = require('../middlewares/auth');

// Make an offer
router.post('/', auth.isLoggedIn, offerController.makeOffer);

// View all offers received on an item
router.get('/', auth.isLoggedIn, offerController.viewOffers);

// Accept an offer
router.post('/:offerId/accept', auth.isLoggedIn, auth.isOwner, offerController.acceptOffer);

module.exports = router;