# Online-Store-JS
# Shred Shed – Snowboard Marketplace

**Shred Shed** is a full-stack web application that allows users to browse, list, review, and make offers on snowboards. Designed as a marketplace platform, it features user authentication, image uploads, and secure access control.

---

## Features

-  View all snowboard listings with details and images
-  User signup, login, profile, and session handling
-  Authenticated users can create, edit, and delete listings
-  Upload snowboard images to showcase items
-  Leave reviews and make offers on items
-  Middleware-protected routes for owners and guests
-  Responsive EJS templates and public asset handling

---

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Templating:** EJS
- **Middleware:** express-session, connect-mongo, multer, flash
- **Frontend:** HTML/CSS, Bootstrap (or basic styling)
- **File Uploads:** multer
- **Auth:** Custom middleware for role-based access

---

## Project Structure

```
Online-Store-JS/
│
├── app.js                # Entry point
├── models/               # Mongoose models (User, Item, Review, Offer)
├── routes/               # Express routes (userRoutes, itemRoutes, offerRoutes)
├── controllers/          # Route logic and data handling
├── views/                # EJS templates
├── public/               # Static files (images, uploads, icons)
├── middlewares/          # Auth and access control middleware
└── package.json


```
