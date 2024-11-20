# MyFlix (Backend)

This project is live on Heroku at https://nier-myflix-backend-63a3c9fa7364.herokuapp.com/, where documentation related to all 12 endpoints are also served.

This repository contains the backend code for a movie database API built with Node.js, Express.js, and MongoDB. This is a RESTful API for accessing a database of movies, genres, directors, and user information. Security is a primary focus, with all passwords encrypted using bcrypt before storage and user authentication implemented using JWT (JSON Web Tokens) with passport-jwt and passport-local for authentication strategies.

Please note that all passwords submitted by users (during registration and password changes) are encrypted prior to being stored.

## Technologies Used

- Node.js: JavaScript runtime environment.
- Express.js: Web application framework for Node.js.
- MongoDB: NoSQL document database.
- Mongoose: MongoDB Object Modeling tool for Node.js.
- bcrypt: Password hashing library for secure password storage.
- Passport.js: Authentication middleware for Node.js.
- Passport-JWT: Passport strategy for JWT authentication.
- Passport-Local: Passport strategy for local authentication.
- Express Validator: Middleware for request body validation.
- cors: Middleware to handle Cross-Origin Resource Sharing (CORS).
- morgan: HTTP request logger.

## Dev:

1. Optional: Temporarily connect to a local MongoDB instance via index.js.

```
mongoose.connect(
     'mongodb://localhost:27017/myFlixDB',
     {
  	useNewUrlParser: true,
 	useUnifiedTopology: true
     }
);
```

```
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
```

2. Start the server to test any changes made.

```
node index.js
```

3. After changes have been made, reconnect to MongoDB instance hosted on Atlas.

4. Commit all changes to git. deploy changes to Heroku:

```
git push heroku main
```