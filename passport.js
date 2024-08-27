//
// This document contains passport strategy configs. It sets up:
// (1) a new instance of localStrategy for basic http auth w/ username and password
// (2) a new instance of jwtStrategy for JWT-based auth
//

// ==================================================================

// Imports: local

// models.js exports an object containing Mongoose models for movies and users.
const Users = require('./models.js').User;

// ------------------------------------------------------------------

// Imports: third party
// The strategy constructor creates an instance of a strategy that can be used with Passport
// A strategy define how the auth handling process should be handled

// main passport library.
const passport = require('passport');

// passport-local: strategy constructor for basic http auth w/ username and password
const localStrategy = require('passport-local').Strategy;

// passport-jwt: strategy constructor for JWT-based auth
const jwtStrategy = require('passport-jwt').Strategy;

// another lib from passport-jwt to define how the JWT is extracted from request
const extractJWT = require('passport-jwt').ExtractJwt;

// ==================================================================

// Configuring Passport Strategies

// ==================================================================

// new instance of localStrategy for basic http auth w/ username and password
// 1st arg: obj that contains configuration options for the local strategy
// 2nd arg: asyn func that will be called to look for matches and handle outcomes ofthe lookup
passport.use(
    
    new localStrategy(

	// 1st arg:
	// takes a username and password from the request body
	{
	    // Key: usernameField / passwordField = predefined
	    // Value: anything goes but has to match the name of the field that holds the un / pw in incoming request body.
	    usernameField: 'username',
	    passwordField: 'password',
	},

	// 2nd arg:
	// Mongoose checks db for user
	async (username, password, callback) => {
	    console.log(`Looking for user ${username}.`);
	    // **NOTE** that the password doesn't get checked here
	    await Users.findOne({ username: username })
	    
		.then((user) => {

		    // fail authentification in case of user not found
		    if (!user) {
			console.log(`Incorrect username. User ${username} cannot be found.`);
			return callback(null,  // indicating no err
					false, // but authentication failed.
					{message: 'Incorrect username.'}
				       )};

		    // fail authentification in case of wrong passwords
		    if (!user.validatePassword(password)) {
			console.log('Incorrect password.');
			return callback(null,  // indicating no err
					false, // but authentication failed.
					{message: 'Incorrect password.'}
				       )};

		    // pass authentification
		    console.log('User found and password correct.')
		    console.log('Now executing callback function (login endpoint).');
		    return callback(null, // indicating no err
				    user);
		})

		.catch((error) => {
		    if (error) {
			console.log(error);
			return callback(error);
		    }
		})
	}
    )
);


// new instance of jwtStrategy for JWT-based auth
// 1st arg: obj that contains configuration options for the JWT strategy
// 2nd arg: asyn func that will be called when a JWT is extracted and decoded
passport.use(
    
    new jwtStrategy(

	// 1st arg:
	// takes (extracts) a JWT from the request header
	{
	    // extractJWT lib specifies how the JWT should be extracted from req
	    // In this case, it's from the req header w/ fromAuthHeaderAsBearerToken()
	    jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
	    
	    // **Verifying** info of the token: its secret key /  signature
	    // Normally these are: encrypted, in secure storage, protected with restricted access,
	    // sufficiently complex to prevent brute force attacks, periodically rotated
	    // and NEVER HARDCODED
	    secretOrKey: 'your_jwt_secret',
	},

	// 2nd arg:
	// **Identifying** info of the token: its  "payload" / claim
	// as to who the user is, what they should have access to, and for how long
	// so we can find a user based on jwtPayload._id
	async (jwtPayload, callback) => {
	    return await Users.findById(jwtPayload._id)

	    // user that is uniquely identify with the token identified
	    // w.o. querying multiple dbs or perform additional lookups
		.then((user) => {
		    return callback(null, // indicating no err
				    user);
		})

		.catch((error) => {
		    return callback(error)
		});
	}));
