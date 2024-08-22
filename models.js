//
// This document exports an object containing Mongoose models for movies and users.
//

const mongoose = require('mongoose');

// define schema for docs in 'movies' collection
let movieSchema = mongoose.Schema(
    {
	title: {type: String, required: true},
	director: {
	    name: String,
	    bio: String,
	    dob: Date,
	},
	Genre: {
	    name: String,
	    description: String,
	},
    }
);

// define schema for docs in 'users' collection
let userSchema = mongoose.Schema(
    {
	username: {type: String, required: true},
	// FavoriteMovies key within userSchema contains an array of IDs
	// that each refer to a document within the "db.movies" collection.
	favoriteMovies: [
	    {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Movie',
	    }
	]
    }
);

// create models that use the schemas defined
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
// note it's capitalised and singular.
// any title that you pass through capitalised or singular will come out on the other side as lowercase and pluralized. i.e. "db.movies", "db.users"

module.exports.Movie = Movie;
module.exports.User = User;
