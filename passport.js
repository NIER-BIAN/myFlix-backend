//
// This document contains passport strategies configurations
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
// 1st arg: obj that contains username & password fields
// 2nd arg: asyn func that will be called after to look for matches and handle errors
passport.use(
    
    new localStrategy(

	// 1st arg:
	// takes a username and password from the request body
	{
	    usernameField: 'username',
	    passwordField: 'password',
	},

	// 2nd arg:
	// Mongoose checks db for user
	async (username, password, callback) => {
	    console.log(`Looking for user ${username} with password "${password}"`);
	    // **NOTE** that the password doesn't get checked here
	    await Users.findOne({ username: username })
	    
		.then((user) => {

		    // user not found
		    if (!user) {
			console.log(`Incorrect username. User ${username} cannot be found.`);
			return callback(null, // indicating no err
					false,
					{message: 'Incorrect username or password.',}
				       )};

		    // user found, callback function (login endpoint) exectues
		    console.log('User found. Callback function (login endpoint) will exectue');
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
	    
	    //"secret" key to verify the signature of the JWT
	    secretOrKey: 'your_jwt_secret',
	},

	// 2nd arg:
	// find a user based on the _id field extracted from the JWT payload
	// The "payload" is the claim / content of the JWT itself
	// who the user is, what they should have access to, and for how long
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
