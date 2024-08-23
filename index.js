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
      uuid = require('uuid');

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

// JSON & URL PARSING:
// parses incoming req bodies in JSON format and saves to req.body
// used in POST reqs to get info not stored in the req URL
app.use(express.json())
// extended: true  allows nested objects
app.use(express.urlencoded({ extended: true }));

// USER AUTH:
// the app object represents the Express application
// passing the app object during the require call makes it available within auth.js.
// auth.js exports a function that sets up a route handler for POST requests to the "/login" endpoint.
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
app.post('/users', async (req, res) => {
    
    // query the “Users” model
    // obj destructuring: const obj = { a: 1, b: 2 }; const { a, b } = obj;
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
			password: req.body.password,
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
// Modifying user info would in this way require a JWT from the client for authorisation
app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {

    // req.login in auth.js establish a login session and set up the user object on req.user.
    if(req.user.username !== req.params.username){
        return res.status(400).send(`You have to be logged in as ${req.params.username} to make changes to their list of favourite movies. Permission denied`);
    }
    
    await Users.findOneAndUpdate(
	{ username: req.params.username },
	// $push adds a new movie ID to the end of the FavoriteMovies array
	{ $push: { FavoriteMovies: req.params.movieId } },
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
// Modifying user info would in this way require a JWT from the client for authorisation
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {

    // req.login in auth.js establish a login session and set up the user object on req.user.
    if(req.user.username !== req.params.username){
        return res.status(400).send(`You have to be logged in as ${req.params.username} to change their account info. Permission denied`);
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
    
        // accepts the returned document updatedUser
        // Sends the document as a JSON response to the client
	.then((updatedUser) => {
	    res.json(updatedUser);})
	.catch((err) => {
	    console.error(err);
	    res.status(500).send('Error: ' + err);
	})
});

//---------------------------
// DELETE

// Allow users to remove a movie to their list of favorites
// Modifying user info in this way would require a JWT from the client for authorisation
app.delete('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    
    // req.login in auth.js establish a login session and set up the user object on req.user.
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

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
