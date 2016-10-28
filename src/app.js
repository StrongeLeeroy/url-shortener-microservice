import express from 'express';
import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

export const app = express();
mongoose.connect('mongodb://localhost:27017/urlShortener');

var urlEntrySchema = mongoose.Schema({
	original: String,
	shortCode: { type: Number, index: true }
});
urlEntrySchema.index({ shortCode: 1 });
urlEntrySchema.set('autoIndex', false);

var UrlEntry = mongoose.model('UrlEntry', urlEntrySchema);

app.get('/:shortCode', (req, res) => {
	let shortCode = parseInt(req.params.shortCode);
	if (isNaN(shortCode)) {
		res.status(200).json({ error: 'Invalid URL shortCode. It must be a number.' })
	} else {
		UrlEntry.findOne({ shortCode }).then(doc => {
			if (!doc) {
				res.status(404).json({ error: 'Page not found' });
			} else {
				res.redirect(doc.original);
			}
		});
	}
});

app.get('/new/*', (req, res) => {
	let url = req.params[0]; // Unnamed parameter is placed in the first position inside params
	console.log(req.headers);
	if (isValidUrl(url)) {
		isDuplicate(url).then(exists => {
			if (exists) {
				res.status(200).json({ error: 'URL already exists in the database.', shortCode: exists });
			} else {
				insertNew(url).then(() => {
					res.status(200).send(`Url successfully shortened: http://www.testdomain.com/${newCode}`);
				});
			}
		});
	} else {
		res.status(200).json({ error: 'Invalid URL format. Input URL must comply to the following: http(s)://(www.)domain.ext(/)(path)'});
	}
	
});

function isValidUrl(url) {
	// Must comply to this format () means optional:
	// http(s)://(www.)domain.ext(/)(whatever follows)
	let regEx = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;
	return regEx.test(url);
}

function getShortCode() {
	return UrlEntry
		.find()
		.sort({ shortCode: -1 })
		.limit(1)
		.select({ _id: 0, shortCode: 1 })
		.then(docs => {
			return docs.length === 1 ? docs[0].shortCode + 1 : 0;
		});
}

function isDuplicate(url) {
	return UrlEntry
		.findOne({ original: url})
		.then(doc => doc ? doc.shortCode : false );
}

function insertNew(url) {
	return getShortCode().then(newCode => {
		let newUrl = new UrlEntry({ original: url, shortCode: newCode });
		return newUrl.save();
	});
}