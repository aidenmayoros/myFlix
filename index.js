require('dotenv').config();

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
// mongoose.connect('mongodb://localhost:27017/myFlix', {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true,
// });

const uuid = require('uuid');
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// AWS imports
const {
	S3Client,
	ListObjectsV2Command,
	PutObjectCommand,
} = require('@aws-sdk/client-s3');

// Server side validation library
const { check, validationResult } = require('express-validator');

app.use(express.static(path.join(__dirname, 'client')));

// Set which http oragins are allowed to access API
let allowedOrigins = [
	'http://localhost:8080',
	'http://localhost:1234',
	'http://localhost:4200',
	'http://testsite.com',
	'https://aidens-myflix-api.herokuapp.com',
	'https://git.heroku.com/aidens-myflix-api.git',
	'https://aidenmayoros.github.io',
	'http://54.146.195.19',
];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) === -1) {
				// If a specific origin isn’t found on the list of allowed origins
				let message =
					'The CORS policy for this application doesn’t allow access from origin ' +
					origin;
				return callback(new Error(message), false);
			}
			return callback(null, true);
		},
	})
);

// Log URL request data to log.txt text file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
	flags: 'a',
});

// middleware
app.use('/api/docs', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: accessLogStream }));

// import and set up passport.js and auth.js
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

// Using AWS S3 with LocalStack
const s3Client = new S3Client({
	region: 'us-east-1',
	endpoint: 'http://localhost:4566',
	forcePathStyle: true,
});

// const listObjectsParams = {
// 	Bucket: 'my-cool-local-bucket',
// };

// listObjectsCmd = new ListObjectsV2Command(listObjectsParams);
// s3Client.send(listObjectsCmd);

// AWS return all images in bucket
app.get('/images', (req, res) => {
	listObjectsParams = {
		Bucket: 'my-cool-local-bucket',
	};
	s3Client
		.send(new ListObjectsV2Command(listObjectsParams))
		.then((listObjectsResponse) => {
			res.send(listObjectsResponse);
		});
});

// AWS upload img file to bucket
app.post('/upload', (req, res) => {
	const uploadParams = {
		Bucket: req.body.Bucket,
		Key: req.body.Key,
		Body: fs.createReadStream(req.body.Body),
		ContentType: 'image/jpg',
	};
	s3Client
		.send(new PutObjectCommand(uploadParams))
		.then((uploadResponse) => {
			res.send(uploadResponse);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error uploading image');
		});
});

/**
 * Get all movies for a logged in user
 * @returns {Array} array of all movies in database
 */
app.get(
	'/api/movies',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.find()
			.then((movies) => {
				res.status(200).json(movies);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * Get movie by title
 * @param {string} title movie title
 * @returns {Object} object with a single movie
 */
app.get(
	'/api/movies/title/:Title',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.findOne({ Title: req.params.Title })
			.then((movie) => {
				if (!movie) {
					return res
						.status(404)
						.send('Error: ' + req.params.Title + ' was not found');
				}
				res.status(200).json(movie);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

// Get movies by genre

/**
 * Get movies by genre
 * @param {string} genre movie genre
 * @returns {Array} array of movies that share genre
 */

app.get(
	'/api/movies/genre/:Genre',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.find({ 'Genre.Name': req.params.Genre })
			.then((movies) => {
				if (movies.length == 0) {
					return res
						.status(404)
						.send(
							'Error: no movies found with the ' +
								req.params.Genre +
								' genre type.'
						);
				}
				res.status(200).json(movies);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * Get all movies by the same director
 * @param {string} director director name
 * @returns {Array} array of movies that share director
 */

app.get(
	'/api/movies/directors/:Director',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.find({ 'Director.Name': req.params.Director })
			.then((movies) => {
				if (movies.length == 0) {
					return res
						.status(404)
						.send(
							'Error: no movies found with the director ' +
								req.params.Director +
								' name'
						);
				}
				res.status(200).json(movies);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * Get a director by name
 * @param {stirng} director director name
 * @returns {Object} object with director information
 */

app.get(
	'/api/movies/director_description/:Director',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.findOne({ 'Director.Name': req.params.Director })
			.then((movie) => {
				if (!movie) {
					return res
						.status(404)
						.send('Error: ' + req.params.Director + ' was not found');
				}
				res.status(200).json(movie.Director);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * Get a genre description by genre name
 * @param {string} genre genre name
 * @returns {string} genre description
 */

app.get(
	'/api/movies/genre_description/:Genre',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.findOne({ 'Genre.Name': req.params.Genre })
			.then((movie) => {
				if (!movie) {
					return res
						.status(404)
						.send('Error: ' + req.params.Genre + ' was not found');
				}
				res.status(200).json(movie.Genre.Description);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * gets all of the users
 * @returns an array of users
 */

app.get(
	'/api/users',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.find()
			.then((users) => {
				res.status(200).json(users);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

// Get a single user
app.get(
	'/api/users/:Username',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.findOne({ Username: req.params.Username })
			.populate({ path: 'FavoriteMovies' })
			.then((user) => {
				if (!user) {
					return res
						.status(404)
						.send('Error: ' + req.params.Username + ' was not found');
				}
				res.json(user);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * Allow new users to register
 * @param {string} Username username
 * @param {string} Password password
 * @param {string} Email email
 * @param {date} Birthday birthday
 * @returns {Object} created user
 */

app.post(
	'/api/users',
	[
		// Validation
		check(
			'Username',
			'Username must be at least 5 characters in length'
		).isLength({ min: 5 }),
		check(
			'Username',
			'Username contains non alphanumeric characters - not allowed.'
		).isAlphanumeric(),
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
				console.log(user);

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

/**
 * Add a movie to a user's list of favorites
 * @param {string} Username
 * @param {string} MovieID
 * @returns {Object} of the updated user
 */

app.post(
	'/api/users/:Username/movies/:MovieID',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movies.findById({ _id: req.params.MovieID })
			.then((movie) => {
				if (!movie) {
					return res.status(404).send('Error: Movie was not found in database');
				}

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
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	}
);

/**
 * Update user information
 * @param {string} Username
 * @returns {Object} updated user object
 */

app.put(
	'/api/users/:Username',
	passport.authenticate('jwt', { session: false }),
	[
		check('Username', 'Username is required').isLength({ min: 4 }),
		check(
			'Username',
			'Username contains non alphanumeric characters - not allowed.'
		).isAlphanumeric(),
		check('Password', 'Password is required').not().isEmpty(),
		check('Email', 'Email does not appear to be valid').isEmail(),
	],
	(req, res) => {
		// check the validation object for errors
		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.Password);
		Users.findOneAndUpdate(
			{ Username: req.params.Username },
			{
				$set: {
					Username: req.body.Username,
					Password: hashedPassword,
					Email: req.body.Email,
					Birthday: req.body.Birthday,
				},
			},
			{ new: true }
		)
			.then((updatedUser) => {
				if (!updatedUser) {
					return res.status(404).send('Error: User was not found');
				}
				res.json(updatedUser);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

/**
 * Remove a movie from a user's list of favorites
 * @param {string} Username
 * @param {string} MovieID
 * @returns {Object} updated user object
 */

app.delete(
	'/api/users/:Username/movies/:MovieID',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
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
	}
);

/**
 * Delete a user
 * @param {string} Username
 * @returns {string} confirming if the user was deleted
 */

app.delete(
	'/api/users/:Username',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Users.findOneAndRemove({ Username: req.params.Username })
			.then((user) => {
				if (!user) {
					res
						.status(404)
						.send('User ' + req.params.Username + ' was not found');
				}
				res.status(200).send(req.params.Username + ' was deleted.');
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	}
);

// Load documentation from html file
app.use('/documentation', express.static(path.join(__dirname, '/public')));

// app.get('*', function (req, res) {
// 	res.sendFile(path.join(__dirname + '/client/index.html'));
// });
// mongodb+srv://aidenmayoros:MLjeNGlQaR3e4HDq@cluster0.pig01bx.mongodb.net/myFlixDB?retryWrites=true&w=majority

app.use('*', express.static(path.join(__dirname, '/client')));

app.use((err, req, res, next) => {
	console.log(err);
	console.error(err.stack);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log('Listening on Port ' + port);
});
