const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  status: {
    type: String,
    enum: ['pending', 'rejected', 'accepted'],
    default: 'pending'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  }
}, {
  timestamps: true
});

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

module.exports = Offer;