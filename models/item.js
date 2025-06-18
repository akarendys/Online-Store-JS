const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    title: { type: String, required: true },
    condition: { type: String, required: true },
    price: { 
        type: Number, 
        required: true, 
        min: [0.01, 'Price must be at least 0.01'] 
    },
    details: { type: String, required: true },
    image: { type: String, default: '/images/default.png' },
    active: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User
    totalOffers: { type: Number, default: 0 },
    highestOffer: { type: Number, default: 0 },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }]
}, {
    timestamps: true
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

module.exports = Item;
