const express = require('express'),
	morgan = require('morgan'),
	fs = require('fs'),
	path = require('path');

const app = express();

let favoriteMovies = JSON.stringify({
	favoriteMovies: [
		{
			name: 'The Thing',
			year: '2011',
		},
		{
			name: 'Shark Tale',
			year: '2004',
		},
		{
			name: 'The Bourne Legacy',
			year: '2012',
		},
		{
			name: 'Minions: The Rise of Gru',
			year: '2022',
		},
		{
			name: 'How to Train Your Dragon',
			year: '2010',
		},
		{
			name: 'Matilda',
			year: '1996',
		},
		{
			name: 'Open Season',
			year: '2006',
		},
		{
			name: 'Spirit: Stallion of the Cimarron',
			year: '2002',
		},
		{
			name: 'The Bad Guys',
			year: '2022',
		},
		{
			name: 'The Sea Beast',
			year: '2022',
		},
	],
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.static('public'));

app.get('/movies', (req, res) => {
	res.send(favoriteMovies);
});

app.get('/', (req, res) => {
	res.send('This is the default route endpoint');
});

app.use((err, req, res, next) => {
	console.log(error);
	console.error(err.stack);
});

app.listen(8080, (req, res) => {
	console.log('App listening on port 8080');
});
