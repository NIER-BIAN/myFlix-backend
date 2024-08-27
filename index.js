// ==================================================================

// index requires auth, passport, and models
// auth requires passport
// passport requires models

// ==================================================================

// Pre-amble

// ==================================================================

// imports: built-in
const fs = require('fs'),
      path = require('path');

// imports: third party
const express = require('express'),
      morgan = require('morgan'),
      uuid = require('uuid'),
      { check, validationResult } = require('express-validator');

// imports: mongoose and local
const mongoose = require('mongoose');
const Models = require('./models.js');
// models.js exports an object containing Mongoose models for movies and users.
const Movies = Models.Movie;
const Users = Models.User;

//---------------------------

// connect to database
// mongoose can now perform CRUD operations on the docs in myFlixDB from within the REST API
mongoose.connect(
    'mongodb://localhost:27017/myFlixDB',
    {
	// ensure that Mongoose uses the latest MongoDB Node.js driver features
	useNewUrlParser: true,
	useUnifiedTopology: true
    }
);

//---------------------------

// create: an express instance
const app = express();

// create: an write stream (in append mode) for logging
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(
    //fs.createWriteStream( path, options )
    path.join(__dirname, 'log.txt'),
    {flags: 'a'},
)

// ==================================================================

// Middleware functions to be added to the request handling pipeline

// ==================================================================

// LOGGING:

app.use(morgan(
    'combined',                // write w/ Morgan’s “combined” format
    {stream: accessLogStream}, // write to specified stream
));
let requestTime = (req, res, next) => {
    // logs to console and add property to req object.
    console.log(Date.now());
    req.requestTime = Date.now();
    next();
};
// requestTime() etc should now be fired with every request to requests to all URLs
app.use(requestTime);

//---------------------------

// BODY PARSING:
// parses incoming req bodies in JSON format and saves to req.body
// used in POST reqs to get info not stored in the req URL

app.use(express.json())
// extended: true  allows nested objects
app.use(express.urlencoded({ extended: true }));

//---------------------------

// CORS-RELATED
// ensure CORS headers are are properly set for all incoming reqs

const cors = require('cors');

// set up express instance to only allow reqs from certain origins
// only allow reqs from domains that need API. e.g. the app’s own FE that's separately hosted

// (if it's  hosted separately from the API, you’d want to ensure the domain hosting your frontend was granted access. The fewer domains that have access to your API, the more secure it (and the data it provides access to) will be.
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors(

    {
	// cors() function initialised with obj as  arg. In this case, obj has only 1 field.
	origin: (origin, callback) => {

	    // Pass all reqs made w.o. an Origin header (i.e. usually a same-origin req)
	    if(!origin) return callback(null, // no err
					true  // auth passed
				       );

	    // Fail all reqs made from origins outside of list of allowed origins
	    if(allowedOrigins.indexOf(origin) === -1){
		let message = `Access denied for origin: {origin}`;
		return callback(new Error(message ), // err
				false);              // auth failed
	    }
	    
	    return callback(null, // no err
			    true  // auth passed
			   );
	}
}));

//---------------------------

// USER AUTH:
// the app object represents the Express application
// passing the app object during the require call makes it available within auth.js.
// auth.js exports a function that sets up a route handler for POST requests to the "/login" endpoint.
// all auth logic (endpoint and an immediately invoked passport.authenticate middleware function)
// are encapsulate within auth.js

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

// STATIC FILES:
// URL/path at which static files are exposed
app.use(express.static('public'));

// ==================================================================

// Route calls

// ==================================================================

// app.method (path, handler)
// “PATH” = endpoint URL the request is targeting.
// “HANDLER” =  function to be executed when the route is matched. 

app.get('/', (req, res) => {
    
    let responseText = 'Welcome to myFlix!<br>';
    responseText += `<small>Requested at ${req.requestTime}.</small><br>`;
    responseText += `<small>URL: ${req.url}.</small><br>`;
    res.send(responseText);
    
});

//---------------------------
// CREATE

// Allow new users to register;
app.post('/users',

    // validation logic
	 [
	     check('username', 'Username is required').isLength({min: 5}),
	     check('username', 'Username contains non alphanumeric characters').isAlphanumeric(),
	     check('password', 'Password is required').not().isEmpty()
	 ],
	 
	 async (req, res) => {
	     // check the validation object for errors
	     let errors = validationResult(req);

	     // if error occurs, rest of code will not execute,
	     if (!errors.isEmpty()) {
		 return res.status(422).json({ errors: errors.array() });
	     }

	     // password hashing
	     let hashedPassword = Users.hashPassword(req.body.password);
 
	     // query the “Users” model
	     await Users.findOne({ username: req.body.username })
	         // pass on "user", as in, the document that was just read
		 .then((user) => {
		     
		     // if user already exist, avoid repeat entries.
		     if (user) {
			 return res.status(400).send(`${req.body.username} already exists.`);
			 
		     } else {
			 Users
			     .create({
				 // collect info from the HTTP request body
				 // Mongoose translate Node.js code into MongoDB command
				 // which in turn populates the Users document
				 username: req.body.username,
				 password: hashedPassword,
			     })

			     // return "user”, as in, the document that was just added
			     .then((user) => { res.status(201).json(user) })

			     .catch((error) => {
				 console.error(error);
				 res.status(500).send('Error: ' + error);
			     })
		     }
		 })
		 .catch((error) => {
		     console.error(error);
		     res.status(500).send('Error: ' + error);
		 });
});

// Allow users to add a movie to their list of favorites
// Modifying user info in this way would require a JWT from the client for authorisation
app.patch('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {

    // req.login in auth.js establishes a login session and set up the user object on req.user.
    if(req.user.username !== req.params.username){
        return res.status(400).send(`You have to be logged in as ${req.params.username} to make changes to their list of favourite movies. Permission denied`);
    }
    
    await Users.findOneAndUpdate(
	{ username: req.params.username },
	// $push adds a new movie ID to the end of the FavoriteMovies array
	{ $push: { favoriteMovies: req.params.movieId } },
	{ new: true })
	.then((updatedUser) => {
	    res.json(updatedUser);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: '  + err);
	});
});

//---------------------------
// READ

// Return a list of ALL users
// Search function would require a JWT from the client
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // note: find() function in Mongoose grabs data on ALL documents
    await Users.find()
	.then((users) => {
	    res.status(201).json(users);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// Return data about a single user by username
// Search function would require a JWT from the client
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ username: req.params.username })
	.then((user) => {
	    res.json(user);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// Return a list of ALL movies;
app.get('/movies', async (req, res) => {
    // note: find() function in Mongoose grabs data on ALL documents
    await Movies.find()
	.then((movies) => {
	    res.status(201).json(movies);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// Return data about a single movie by title;
// Search function would require a JWT from the client
app.get('/movies/:searchTermTitle', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ "title": req.params.searchTermTitle })
	.then((movie) => {
	    res.json(movie);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// Return data about a genre by name (e.g., “Thriller”);
// Search function would require a JWT from the client
app.get('/movies/genre/:searchTermGenre', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ "genre.name" : req.params.searchTermGenre })
	.then((movie) => {
	    res.json(movie);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// Return data about a director by name;
// Search function would require a JWT from the client
app.get('/movies/directors/:searchTermDirector', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ "director.name" : req.params.searchTermDirector })
	.then((movies) => {
	    res.json(movies);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

//---------------------------
// UPDATE

// Allow users to update their user info (username)
// Modifying user info in this way would require a JWT from the client for authorisation
app.put('/users/:username',
	passport.authenticate('jwt', { session: false }),
	[
	    check('username', 'Username is required').isLength({min: 5}),
	    check('username', 'Username contains non alphanumeric characters').isAlphanumeric(),
	    check('password', 'Password is required').not().isEmpty()
	],
	
	async (req, res) => {

	    // req.login in auth.js establishes a login session and set up the user object on req.user.
	    if(req.user.username !== req.params.username){
		return res.status(400).send(`You have to be logged in as ${req.params.username} to change their account info. Permission denied`);
	    }
	    
	    // check the validation object for errors
	    let errors = validationResult(req);

	    // if error occurs, rest of code will not execute,
	    if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	    }
    
	    await Users.findOneAndUpdate(

		// condition
		{ username: req.params.username },
		{ $set:
		  // object that specs which fields to update and what to update  to
		  {
		      username: req.body.username,
		      password: req.body.password,
		  }
		},
	
		// specify that the newly modified document is returned
		// instead of the old/original document
		{ new : true })

		.then((updatedUser) => {
		    res.json(updatedUser);})
		.catch((err) => {
		    console.error(err);
		    res.status(500).send('Error: ' + err);
		});
	}
);

//---------------------------
// DELETE

// Allow users to remove a movie to their list of favorites
// Modifying user info in this way would require a JWT from the client for authorisation
app.delete('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    
    // req.login in auth.js establishes a login session and set up the user object on req.user.
    if(req.user.username !== req.params.username){
	return res.status(400).send(`You have to be logged in as ${req.params.username} to make changes to their list of favourite movies. Permission denied`);
    }
    
    await Users.findOneAndUpdate(
	{ username: req.params.username },
	// $pull removes a movie ID from the FavoriteMovies array
	{ $pull: { FavoriteMovies: req.params.movieID } },
	{ new: true })
	.then((updatedUser) => {
	    res.json(updatedUser);
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// Allow existing users to deregister
// Modifying user info in this way would require a JWT from the client for authorisation
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {

    // req.login in auth.js establish a login session and set up the user object on req.user.
    if(req.user.username !== req.params.username){
        return res.status(400).send(`You have to be logged in as ${req.params.username} to deregister their account. Permission denied`);
    }
    
    await Users.findOneAndDelete({ username: req.params.username })
	.then((user) => {
	    if (!user) {
		res.status(400).send(req.params.username + ' was not found');
	    } else {
		res.status(200).send(req.params.username + ' was deleted.');
	    }
	})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	});
});

// ==================================================================

// Error-handling

// ==================================================================

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// ==================================================================

// app.listen()

// ==================================================================

// Dev:
// app.listen(8080, () => {
//    console.log('Your app is listening on port 8080.');
//});

// looks for pre-configured port no. in the env variable process.env.PORT
// if nothing is found, sets  port to a certain port number.

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
});

// server listening on all available network interfaces (0.0.0.0)
// i.e. it will accept connections from any device that can reach the server
// or are connected to the network where the server is running.
// it's like setting up a phone line on a specific number (port)
// '0.0.0.0' means that the server is willing to answer calls from anyone who knows the number (port), no matter where they are calling from.
