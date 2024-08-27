//
// This document sets up authentication logic for
// (1) Logging in a user via basic http auth w/ username and password
// (2) Assiging a unique access token to user via JWT-based auth
//
// All auth logic (endpoint and an immediately invoked passport.authenticate middleware function)
// are encapsulate within this document then integrated into the main application flow in index.js.
//
// This document also exports a function that takes a router obj as arg
// required in index.js as let auth = require('./auth')(app);
// i.e. the app obj / the express application is available in auth.js 
//

// ==================================================================

// Imports: local

// Your local passport file
require('./passport');

// jwtSecret that matches secretOrKey in jwtStrategy instance in passport.js
// Normally these are: encrypted, in secure storage, protected with restricted access,
// sufficiently complex to prevent brute force attacks, periodically rotated
// and NEVER HARDCODED
const jwtSecret = 'your_jwt_secret';

// ------------------------------------------------------------------

// Imports: third party

// main passport library
const passport = require('passport');

// lib used for generating and verifying JWTs
const jwt = require('jsonwebtoken');

// ==================================================================

// Authentication Logic

// ==================================================================

// Identity will be authenticated via basic HTTP authentication
// Then, a JWT is assigned to the user

// to be called by exported function
let generateJWTToken = (user) => {
    
    // takes user as arg and generates a JWT token for that user.
    // the jwt.sign method signs payload / claim of the token
    return jwt.sign(user, jwtSecret, {

	// the username you’re encoding in the JWT
	subject: user.username,
	// expires in 7 days
	expiresIn: '7d',
	// algo used to sign / encode teh values of the JWT
	algorithm: 'HS256',
    });
}

// exports a function that takes a router object as an argument
// required in index.js as let auth = require('./auth')(app);
// which makes the app obj / the express application available within auth.js 
module.exports = (router) => {

    // app.method (path, handler)
    // sets up a route handler for POST requests to the "/login" endpoint
    router.post('/login', (req, res) => {

	// middleware function (immediately invoked)
	// LocalStrategy used to check that the un and pw in the body exist in db
	// passport.authenticate(strategy, options, callback) 
	passport.authenticate(
	    // remember passport-local is commonly used for basic and session-based auth
	    'local',                  // strategy
	    { session: false },       // options
	    (error, user, info) => {  // callback

		// if user not found
		if (error || !user) {
		    return res.status(400).json({
			message: 'Something is not right',
			user: user
		    });
		}

		// if user found, log them in.
		req.login(user, { session: false }, (error) => {
		    // The login method is added to the req object by Passport
		    // It is exposed if Passport is configured w. strategy that supports login
		    // It establishes login session for the user and sets up user obj on req.user
		
		    if (error) {
			res.send(error);
		    }

		    // user exists and a JWT is made
		    let token = generateJWTToken(user.toJSON());
		    // return token to client
		    // ES6 shorthand for res.json({ user: user, token: token })
		    return res.json({ user, token });
		});

		// this line immediately invokes the passport.authenticate middleware function
		// with the req and res objects as arguments
	    })(req, res);
    });
}
