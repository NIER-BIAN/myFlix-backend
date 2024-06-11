// =============
// Pre-amble
// =============

// imports: built-in
const fs = require('fs'),
      path = require('path');

// imports: third party
const express = require('express'),
      morgan = require('morgan'),
      bodyParser = require('body-parser'),
      uuid = require('uuid');

// create express instance
const app = express();

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(
    //fs.createWriteStream( path, options )
    path.join(__dirname, 'log.txt'),
    {flags: 'a'},
)

// URL/path at which static files are exposed
app.use(express.static('public'));

// bodyParser.json() = middleware function from the body-parser package
// parses incoming req bodies in JSON format and saves to req.body
// Used in POST reqs to get info not stored in the req URL
app.use(bodyParser.json());

// =============
// users array
// =============

let users = [
    {
	id: 1,
	name: 'Abraham',
	favouriteMovies: [],
    },
    {
	id: 2,
	name: 'Bessie',
	favouriteMovies: [],	    
    },
];

// =============
// movies array
// =============

let movies = [
    {
	title: 'Amélie',
	director: {
	    name: 'Jean-Pierre Jeunet',
	    bio: 'Jean-Pierre Jeunet is a French film director known for his distinctive visual style. He gained international acclaim for directing the film "Amélie."',
            dob: '03/09/1953',
        },
        genre: {
            name: 'Romantic Comedy',
            description: 'Romantic comedies are a subgenre of comedy movies that focus on the romantic relationships between characters. They often involve humorous situations and light-hearted storytelling.',
        },
    },
    {
        title: 'Interstellar',
        director: {
            name: 'Christopher Nolan',
            bio: 'Christopher Nolan is a British-American film director and screenwriter. Known for his mind-bending narratives and visually stunning films, he has directed movies like "Inception" and "The Dark Knight."',
            dob: '07/30/1970',
        },
        genre: {
            name: 'Science Fiction',
            description: 'Science fiction movies explore imaginative and futuristic concepts, often involving advanced science and technology. They often speculate on the possibilities of the future or alternative realities.',
        },
    },
    {
        title: 'Pride & Prejudice',
        director: {
            name: 'Joe Wright',
            bio: 'Joe Wright is an English film director known for his period dramas. He has directed films such as "Atonement" and "Darkest Hour."',
            dob: '08/25/1972',
        },
        genre: {
            name: 'Drama',
            description: 'Drama movies depict realistic characters and their emotional journeys. They often explore complex themes and relationships, and can encompass a wide range of storytelling styles.',
        },
    },
    {
        title: 'When Marnie Was There',
        director: {
            name: 'Hiromasa Yonebayashi',
            bio: 'Hiromasa Yonebayashi is a Japanese animator and film director. He has worked with Studio Ghibli and directed films like "Arrietty" and "Mary and The Witch\'s Flower."',
            dob: '07/10/1973',
        },
        genre: {
            name: 'Animation',
            description: 'Animated movies use techniques like computer animation or traditional hand-drawn animation to tell stories. They can span various genres and appeal to audiences of all ages.',
        },
    },
    {
        title: 'Contact',
        director: {
            name: 'Robert Zemeckis',
            bio: 'Robert Zemeckis is an American film director, screenwriter, and producer. He is known for directing movies such as "Back to the Future" trilogy and "Forrest Gump."',
            dob: '05/14/1952',
        },
        genre: {
            name: 'Science Fiction',
            description: 'Science fiction movies explore imaginative and futuristic concepts, often involving advanced science and technology. They often speculate on the possibilities of the future or alternative realities.',
        },
    },
    {
        title: '(500) Days of Summer',
        director: {
            name: 'Marc Webb',
            bio: 'Marc Webb is an American music video, short film, and film director. He gained recognition for directing the film "(500) Days of Summer" and later directed "The Amazing Spider-Man" series.',
            dob: '08/31/1974',
        },
        genre: {
            name: 'Romantic Comedy',
            description: 'Romantic comedies are a subgenre of comedy movies that focus on the romantic relationships between characters. They often involve humorous situations and light-hearted storytelling.',
        },
    },
    {
        title: 'Spirited Away',
        director: {
            name: 'Hayao Miyazaki',
            bio: 'Hayao Miyazaki is a Japanese film director, animator, and manga artist. He co-founded Studio Ghibli and is known for directing animated films like "Spirited Away" and "My Neighbor Totoro."',
            dob: '01/05/1941',
        },
        genre: {
            name: 'Animation',
            description: 'Animated movies use techniques like computer animation or traditional hand-drawn animation to tell stories. They can span various genres and appeal to audiences of all ages.',
        }
    },
    {
	title: 'The Martian',
	director: {
	    name: 'Ridley Scott',
	    bio: 'Ridley Scott is an English film director and producer. He is known for directing movies such as "Alien," "Blade Runner," and "Gladiator."',
	    dob: '11/30/1937',
	},
	genre: {
	    name: 'Science Fiction',
	    description: 'Science fiction movies explore imaginative and futuristic concepts, often involving advanced science and technology. They often speculate on the possibilities of the future or alternative realities.',
	},
    },
    {
        title: 'The Lion King',
        director: {
            name: 'Rob Minkoff & Rogers Allers',
            bio: 'Rob Minkoff and Roger Allers are American film directors known for co-directing the animated film "The Lion King."',
            dob: '08/11/1962 (Rob Minkoff), 06/26/1949 (Roger Allers)',
        },
        genre: {
            name: 'Animation',
            description: 'Animation is a genre that involves creating the illusion of motion through a sequence of images. It can encompass various styles and techniques, including hand-drawn animation, computer-generated imagery (CGI), and stop-motion animation.',
        },
    },
    {
        title: 'Titanic',
        director: {
            name: 'James Cameron',
            bio: 'James Cameron is a Canadian film director, producer, and screenwriter. He is known for directing movies such as "Titanic," "Avatar," and "Terminator 2: Judgment Day."',
            dob: '08/16/1954',
        },
        genre: {
            name: 'Romance',
            description: 'Romance movies focus on the romantic relationships between characters. They often depict love, passion, and emotional connections.',
        },
    },
];

// ==================================================================
// Middleware functions to be added to the request handling pipeline
// ==================================================================

let requestTime = (req, res, next) => {
    // logs to console and add property to req object.
    console.log(Date.now());
    req.requestTime = Date.now();
    next();
};

// requestTime() etc should be fired with every request to all requests to all URLs
app.use(requestTime);

app.use(morgan(
    'combined',                // write w/ Morgan’s “combined” format
    {stream: accessLogStream}, // write to specified stream
));

// =============
// Route calls
// =============

// app.method (path, handler)
// “PATH” = endpoint URL the request is targeting.
// “HANDLER” =  function to be executed when the route is matched. 

app.get('/', (req, res) => {
    
    let responseText = 'Welcome to myFlix!<br>';
    responseText += `<small>Requested at ${req.requestTime}.</small><br>`;
    // just use req.url, has nothing to do with myLogger()
    responseText += `<small>URL: ${req.url}.</small><br>`;
	
    res.send(responseText);
});

// -----------------
// CREATE

// Allow new users to register;
app.post('/users', (req, res) => {
    let newUser = req.body;

    if (newUser.name) {
	newUser.id = uuid.v4();
	users.push(newUser);
	res.status(201).json(newUser);
    } else {
	res.status(400).send('Please provide a name.')
    }
});

// -----------------
// READ

// Return a list of ALL movies;
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// Return data about a single movie by title;
app.get('/movies/:searchTermTitle', (req, res) => {
    
    let targetTitle = req.params.searchTermTitle;
    let targetMovie = movies.find( movie => movie.title === targetTitle );

    if (targetMovie) {
	 res.status(200).json(targetMovie);
    } else {
	res.status(400).send('Movie not found.');
    }
    
});

// Return data about a genre by name (e.g., “Thriller”);
app.get('/movies/genre/:searchTermGenre', (req, res) => {
    
    let targetGenreName = req.params.searchTermGenre;
    let targetGenreObj = movies.find( movie => movie.genre.name === targetGenreName ).genre;

    if (targetGenreObj) {
	 res.status(200).json(targetGenreObj);
    } else {
	res.status(400).send('Genre not found.');
    }
    
});

// Return data about a director by name;
app.get('/movies/directors/:searchTermDirector', (req, res) => {
    
    let targetDirectorName = req.params.searchTermDirector;
    let targetDirectorObj = movies.find( movie => movie.director.name === targetDirectorName );

    if (targetDirectorObj) {
	 res.status(200).json(targetDirectorObj.director);
    } else {
	res.status(400).send('Director not found.');
    }
    
});

// -----------------
// UPDATE

// Allow users to update their user info (username)
app.put('/users/:targetId', (req, res) => {

    let targetId = req.params.targetId;
    let updatedUserInfo = req.body;
    
    let user = users.find( user => user.id == targetId ); // id might be string or int

    if (user) {
	user.name = updatedUserInfo.name;
	res.status(200).json(user);
    } else {
	res.status(400).send('User not found.')
    }
});

// Allow users to add a movie to their list of favorites
app.put('/users/:targetId/:movieTitle', (req, res) => {

    const { targetId, movieTitle } = req.params;
    
    let user = users.find( user => user.id == targetId ); // id might be string or int

    if (user) {
	user.favouriteMovies.push(movieTitle);
	res.status(200).send(`${movieTitle} has been added to ${user.name}'s array`);
    } else {
	res.status(400).send('User not found.')
    }
});

// -----------------
// DELETE

// Allow users to remove a movie from their list of favorites
app.delete('/users/:targetId/:targetMovieTitle', (req, res) => {

    const { targetId, targetMovieTitle } = req.params;
    
    let user = users.find( user => user.id == targetId ); // id might be string or int

    if (user) {

	// filter method creates a new array with all the elements
	// except the one that matches the provided title.
	user.favouriteMovies = user.favouriteMovies.filter( favedMovie => favedMovie !== targetMovieTitle );
	res.status(200).send(`${targetMovieTitle} has been removed from ${user.name}'s array`);
    } else {
	res.status(400).send('User not found.')
    }
});

// Allow existing users to deregister
app.delete('/users/:targetId/', (req, res) => {

    const { targetId } = req.params;
    
    let targetUser = users.find( user => user.id == targetId ); // id might be string or int

    if (targetUser) {
	//filter method to create new users array
	users = users.filter( user => user.id != targetId );  // id might be string or int
	res.status(200).send(`${targetUser.name} with id ${targetId} has been removed`);
    } else {
	res.status(400).send('User not found.')
    }
});


// ==============
// Error-handling
// ==============

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// =============
// app.listen()
// =============

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
