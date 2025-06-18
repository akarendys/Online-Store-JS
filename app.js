const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const itemController = require('./controllers/itemController');
const flash = require('connect-flash');
require('dotenv').config();

const app = express();
const port = 3000;
const host = 'localhost';
const mongUri = process.env.MONGODB_URI
// Database connection
mongoose.connect(mongUri)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, host, () => {
            console.log('Server is running on port', port);
        });
    })
    .catch(err => console.log('Database connection error:', err.message));

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (e.g., CSS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongUri,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Use connect-flash middleware
app.use(flash());

// Set up a global middleware to make flash messages available to all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success') || null;
    res.locals.error_msg = req.flash('error') || null;
    next();
});


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Use this middleware for routes that handle file uploads
app.post('/items/new', upload.single('image'), itemController.createNewItem);

app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { id: req.session.userId } : null;
    next();
});


// Routes
app.use('/', userRoutes); // User routes
app.use('/', itemRoutes); // Item routes

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Handle 404 errors (page not found)
app.use((req, res) => {
    res.status(404).render('404', { message: 'Page not found' });
});

