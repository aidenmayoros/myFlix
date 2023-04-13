const express = require('express'),
	morgan = require('morgan'),
	fs = require('fs'),
	path = require('path'),
	bodyParser = require('body-parser'),
	uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

// Log URL request data to log.txt text file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.static('public'));

app.get('/movies', (req, res) => {
	// Add error handling logic
	res.send('Successful GET request returning data on all the movies');
});

app.get('/movies/:title', (req, res) => {
	// Add error handling logic
	// res.json(
	// 	movies.find((movie) => {
	// 		return movie.title === req.params.title;
	// 	})
	// );
	res.send('Successful GET request returning a movie by title or name');
});

app.get('/movies/genre/:genreName', (req, res) => {
	res.send('Successful GET request returning all movies by a genre');
});

app.get('/movies/directors/:directorName', (req, res) => {
	// Add logic to search for director in database and then return it if exists
	// Add error handling logic
	res.send('Successful GET request returning info about found Director by name');
});

app.get('/', (req, res) => {
	res.send('This is the default route endpoint');
});

app.post('/movies/users', (req, res) => {
	let newUser = req.body;

	if (!newUser.userName) {
		const message = 'Missing username in request body';
		res.status(400).send(message);
	} else if (!newUser.email) {
		const message = 'Missing users email address in request body';
		res.status(400).send(message);
	} else if (!newUser.password) {
		const message = 'Missing users password in request body';
		res.status(400).send(message);
	} else {
		newUser.id = uuid.v4();
		// Add logic to add to database
		res.status(201).send(newUser);
	}
});

app.put('/movies/users/:id&username=:username', (req, res) => {
	// Add logic to find user in database and then if exists to update their username
	// Add error handling logic
	res.status(201).send('Successful PUT request updating a users username');
});

app.put('/movies/users/:id/favorites/add&movie=:movieName', (req, res) => {
	// Add logic to add a movie to database of users favoites
	// Add error handling logic
	res.status(201).send('Successful PUT request adding a movie to favorite list');
});

app.delete('/movies/users/:id/favorites/remove&movie=:movieName', (req, res) => {
	// Add logic to remove a movie from users favorite list
	// Add error handling logic
	res.status(202).send('Successful DELETE request removing movie from favorite list');
});

app.delete('/movies/users/delete&user=:id', (req, res) => {
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
