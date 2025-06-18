const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    firstName: { type: String, required: [true, 'First name is required'] },
    lastName: { type: String, required: [true, 'Last name is required'] },
    email: { 
        type: String, 
        required: [true, 'Email address is required'], 
        unique: [true, 'This email address has been used'], 
        match: [/.+@.+\..+/, 'Please use a valid email address']
    },
    password: { type: String, required: [true, 'Password is required'] },
    items: [{ type: Schema.Types.ObjectId, ref: 'Item' }] // Array of item references
});

// Hash password before saving
userSchema.pre('save', function(next) {
    let user = this;
    if (!user.isModified('password')) return next();
    bcrypt.hash(user.password, 10)
    .then(hash => {
        user.password = hash;
        next();
    })
    .catch(err => next(err));
});

// Method to compare input password with hashed password
userSchema.methods.comparePassword = function(inputPassword) {
    return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
