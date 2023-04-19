const express = require('express'),
	morgan = require('morgan'),
	fs = require('fs'),
	path = require('path'),
	bodyParser = require('body-parser'),
	uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./scripts/models');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlix', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log URL request data to log.txt text file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.send('This is the default route endpoint');
});

app.get('/movies', (req, res) => {
	// Add error handling logic
	res.send('Successful GET request returning data on all the movies');
});

app.get('/movies/:title', (req, res) => {
	// Add error handling logic

	// Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
	res.send('Successful GET request returning a movie by title or name');
});

app.get('/movies/genre/:genreName', (req, res) => {
	// Return data about a genre (description) by name/title (e.g., “Thriller”)
	res.send('Successful GET request returning all movies by a genre');
});

app.get('/movies/directors/:directorName', (req, res) => {
	// Add logic to search for director in database and then return it if exists
	// Return data about a director (bio, birth year, death year) by name

	// Add error handling logic
	res.send('Successful GET request returning info about found Director by name');
});

// Get all users
app.get('/users', (req, res) => {
	Users.find()
		.then((users) => {
			res.status(201).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Get a user by username
app.get('/users/:Username', (req, res) => {
	Users.findOne({ Username: req.params.Username })
		.then((user) => {
			res.json(user);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

// Create a new user
app.post('/users', (req, res) => {
	Users.findOne({ Username: req.body.Username })
		.then((user) => {
			if (user) {
				return res.status(400).send(req.body.Username + ' already exists');
			} else {
				Users.create({
					Username: req.body.Username,
					Password: req.body.Password,
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
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', (req, res) => {
	Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
			$push: { FavoriteMovies: req.params.MovieID },
		},
		{ new: true } // This line makes sure that the updated document is returned
	)
		.then((updatedUser) => {
			res.json(updatedUser);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

// Update a users data by username
app.put('/users/:Username', (req, res) => {
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
				return res.status(400).send('Error: No user was found');
			} else {
				res.json(user);
			}
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

app.delete('/users/:id/favorites/remove&movie=:movieName', (req, res) => {
	// Allow users to remove a movie from their list of favorites
	// Add logic to remove a movie from users favorite list
	// Add error handling logic
	res.status(202).send('Successful DELETE request removing movie from favorite list');
});

app.delete('/users/delete&user=:id', (req, res) => {
	// Add error handling logic
	res.status(202).send('Successful DELETE request deleting the user account');
});

app.use((err, req, res, next) => {
	console.log(err);
	console.error(err.stack);
});

app.listen(8080, (req, res) => {
	console.log('App listening on port 8080');
});
