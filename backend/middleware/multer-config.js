const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

const fileFilter = (req, file, callback) => {
    if (MIME_TYPES[file.mimetype]) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('image');

module.exports = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (req.file) {
            const fullPath = path.join('images', req.file.filename);
            sharp(fullPath)
                .toFormat('webp')
                .webp({ quality: 100 })
                .toBuffer()
                .then(data => {
                    fs.writeFile(fullPath.replace(/\.[^/.]+$/, "") + ".webp", data, (err) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }

                        req.file.filename = req.file.filename.replace(/\.[^/.]+$/, "") + ".webp";
                        req.file.mimetype = 'image/webp';
                        req.file.path = fullPath.replace(/\.[^/.]+$/, "") + ".webp";
                        fs.unlink(fullPath, (err) => {
                            if (err) {
                                console.error(`Error deleting original file: ${err}`);
                            }
                            next();
                        });
                    });
                })
                .catch(err => {
                    return res.status(500).json({ error: err.message });
                });
        } else {
            next();
        }
    });
};
