// =============
// Pre-amble
// =============

// imports: built-in
const fs = require('fs'),
      path = require('path');

// imports: third party
const express = require('express'),
      morgan = require('morgan');

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

// =============
// topFilms
// =============

let topFilms = [
    {
	title: 'Amélie',
	director: 'Jean-Pierre Jeunet'
    },
    {
	title: 'Interstellar',
	director: 'Christopher Nolan'
    },
    {
	title: 'When Marnie Was There',
	director: 'Hiromasa Yonebayashi'
    },
    {
	title: 'Contact',
	director: 'Robert Zemeckis'
    },
    {
	title: '(500) Days of Summer',
	director: 'Marc Webb'
    },
    {
	title: 'Spirited Away',
	director: 'Miyazaki Hayao'
    },
    {
	title: 'The Martian',
	director: 'Ridley Scott'
    },
    {
	title: 'Whisper of the Heart',
	director: 'Yoshifumi Kondō'
    },
    {
	title: 'The Lion King',
	director: 'Rob Minkoff & Rogers Allers'
    },
    {
	title: 'Titanic',
	director: 'James Cameron'
    },
];

// =============
// Middleware
// =============

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
    
    let responseText = 'Welcome to my book club!<br>';
    responseText += `<small>Requested at ${req.requestTime}.</small><br>`;
    // just use req.url, has nothing to do with myLogger()
    responseText += `<small>URL: ${req.url}.</small><br>`;
	
    res.send(responseText);
});

// Equivalent to:

// response.writeHead(200, {'Content-Type': 'text/plain'});
// response.end('Welcome to my book club!\n');

// but w.o. having to specify additional information sent alongside  response

app.get('/movies', (req, res) => {
    res.json(topFilms);
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
