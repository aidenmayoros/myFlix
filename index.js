const mongoose = require('mongoose');
const Models = require('./models');
const Movies = Models.Movie;
const Users = Models.User;

// Connect to Mongo Atlas Database
mongoose.connect(process.env.CONNECTION_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// connect to localhost for testing
// mongoose.connect('mongodb://localhost:27017/myFlix', { useNewUrlParser: true, useUnifiedTopology: true });

const uuid = require('uuid');
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Server side validation library
const { check, validationResult } = require('express-validator');

// Set which http oragins are allowed to access API
let allowedOrigins = [
	'http://localhost:8080',
	'http://testsite.com',
	'https://aidens-myflix-api.herokuapp.com/',
	'https://git.heroku.com/aidens-myflix-api.git',
];
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) === -1) {
				// If a specific origin isn’t found on the list of allowed origins
				let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
				return callback(new Error(message), false);
			}
			return callback(null, true);
		},
	})
);

// Log URL request data to log.txt text file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// middleware
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: accessLogStream }));

// import and set up passport.js and auth.js
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

// Default endpoint
app.get('/', (req, res) => {
	res.send('This is the default route endpoint');
});

// Get all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.find()
		.then((movies) => {
			res.status(200).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get movie by title
app.get('/movies/title/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.findOne({ Title: req.params.Title })
		.then((movie) => {
			if (!movie) {
				return res.status(404).send('Error: ' + req.params.Title + ' was not found');
			}
			res.status(200).json(movie);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get movies by genre name
app.get('/movies/genre/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.find({ 'Genre.Name': req.params.Genre })
		.then((movies) => {
			if (movies.length == 0) {
				return res.status(404).send('Error: no movies found with the ' + req.params.Genre + ' genre type.');
			}
			res.status(200).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get movies by director name
app.get('/movies/directors/:Director', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.find({ 'Director.Name': req.params.Director })
		.then((movies) => {
			if (movies.length == 0) {
				return res.status(404).send('Error: no movies found with the director ' + req.params.Director + ' name');
			}
			res.status(200).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get data about a director by name
app.get('/movies/director_description/:Director', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.findOne({ 'Director.Name': req.params.Director })
		.then((movie) => {
			if (!movie) {
				return res.status(404).send('Error: ' + req.params.Director + ' was not found');
			}
			res.status(200).json(movie.Director);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get data about a genre by genre name
app.get('/movies/genre_description/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
	Movies.findOne({ 'Genre.Name': req.params.Genre })
		.then((movie) => {
			if (!movie) {
				return res.status(404).send('Error: ' + req.params.Genre + ' was not found');
			}
			res.status(200).json(movie.Genre.Description);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.find()
		.then((users) => {
			res.status(200).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOne({ Username: req.params.Username })
		.then((user) => {
			if (!user) {
				return res.status(404).send('Error: ' + req.params.Username + ' was not found');
			}
			res.json(user);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Create a new user
app.post(
	'/users',
	[
		check('Username', 'Username must be at least 5 characters in length').isLength({ min: 5 }),
		check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
		check('Password', 'Password is empty').not().isEmpty(),
		check('Email', 'Email does not appear to be valid').isEmail(),
	],
	(req, res) => {
		// check the validation object for errors
		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.Password);
		Users.findOne({ Username: req.body.Username })
			.then((user) => {
				if (user) {
					return res.status(400).send(req.body.Username + ' already exists');
				}
				Users.create({
					Username: req.body.Username,
					Password: hashedPassword,
					Email: req.body.Email,
					Birthday: req.body.Birthday,
				})
					.then((user) => {
						res.status(201).json(user);
					})
					.catch((error) => {
						console.error(error);
						res.status(500).send('Error: ' + error);
					});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	}
);

// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
	// Check if movie is in database
	const isMovieInDatabase = Movies.findById({ _id: req.params.MovieID }).then((movie) => {
		if (!movie) {
			return false;
		}
	});

	// Check if user already has movie in favorites list
	const isMovieInFavorites = Users.findOne({ Username: req.params.Username }).then((user) => {
		if (!user || user.FavoriteMovies.includes(req.params.MovieID)) {
			return false;
		}
	});

	if (!isMovieInDatabase) {
		return res.status(404).end('Error: Movie was not found in our database');
	} else if (!isMovieInFavorites) {
		return res.status(409).end('Error: Movie is already in users favorites list');
	} else {
		Users.findOneAndUpdate(
			{ Username: req.params.Username },
			{
				$addToSet: { FavoriteMovies: req.params.MovieID },
			},
			{ new: true }
		)
			.then((updatedUser) => {
				if (!updatedUser) {
					return res.status(404).send('Error: User was not found');
				}
				res.json(updatedUser);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	}
});

// Update a users data by username
app.put(
	'/users/:Username',
	passport.authenticate(
		'jwt',
		[
			check('Username', 'Username must be at least 5 characters in length').isLength({ min: 5 }),
			check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
			check('Password', 'Password is empty').not().isEmpty(),
			check('Email', 'Email does not appear to be valid').isEmail(),
		],
		{ session: false }
	),
	(req, res) => {
		// check the validation object for errors
		let errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		Users.findOneAndUpdate(
			{ Username: req.params.Username },
			{
				$set: {
					Username: req.body.Username,
					Password: req.body.Password,
					Email: req.body.Email,
					Birthday: req.body.Birthday,
				},
			},
			{ new: true }
		)
			.then((user) => {
				if (!user) {
					return res.status(404).send('Error: No user was found');
				}
				res.json(user);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

// Remove a movie to a user's list of favorites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
			$pull: { FavoriteMovies: req.params.MovieID },
		},
		{ new: true }
	)
		.then((updatedUser) => {
			if (!updatedUser) {
				return res.status(404).send('Error: User not found');
			}
			res.json(updatedUser);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
	Users.findOneAndRemove({ Username: req.params.Username })
		.then((user) => {
			if (!user) {
				res.status(404).send('User ' + req.params.Username + ' was not found');
			}
			res.status(200).send(req.params.Username + ' was deleted.');
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

app.use((err, req, res, next) => {
	console.log(err);
	console.error(err.stack);
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port);
});
