const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
    if (!req.body.book || !req.file) {
        return res.status(400).json({ message: 'Données manquantes' });
    }

    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré' }))
        .catch(error => res.status(400).json({ error }));
};



exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getBookById = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

exports.updateBook = (req, res, next) => {
    let bookObject = {};
    if (req.file) {
        bookObject = {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        };
    } else {
        bookObject = { ...req.body };
    }
    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Non autorisé' });
            }
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Livre modifié' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};


exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Non autorisé' });
            }
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

exports.createBook = (req, res, next) => {
    if (!req.body.book || !req.file) {
        return res.status(400).json({ message: 'Données manquantes' });
    }

    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré' }))
        .catch(error => res.status(400).json({ error }));
};



exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getBookById = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

exports.updateBook = (req, res, next) => {
    let bookObject = {};
    if (req.file) {
        bookObject = {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        };
    } else {
        bookObject = { ...req.body };
    }
    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Non autorisé' });
            }
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Livre modifié' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};


exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Non autorisé' });
            }
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

exports.addRating = (req, res, next) => {
    const rating = parseInt(req.body.rating, 10); 
    if (isNaN(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Rating invalide' });
    }

    const userId = req.auth.userId; 

    Book.findOne({ _id: req.params.id })
        .then(book => {
            const existingRatingIndex = book.ratings.findIndex(r => r.userId.toString() === userId);
            if (existingRatingIndex !== -1) {
                return res.status(400).json({ message: "L'utilisateur a déjà noté ce livre" });
            }

            book.ratings.push({ userId, grade: rating })

          
            book.averageRating = book.ratings.reduce((acc, r) => acc + r.grade, 0) / book.ratings.length;

            return book.save();
        })
        .then(book => res.status(201).json(book)) 
        .catch(error => res.status(400).json({ error }))
};


exports.bestRating = (req, res, next) => {
    Book.find({ averageRating: { $exists: true } }) 
        .sort({ averageRating: -1 }) 
        .limit(3) 
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }))
};
