const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Auth middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Set up multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = path.join(__dirname, '..', 'uploads', req.user.id);
    fs.mkdirSync(userFolder, { recursive: true });
    cb(null, userFolder);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// POST /api/files/upload
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// GET /api/files/list
router.get('/list', verifyToken, (req, res) => {
  const userFolder = path.join(__dirname, '..', 'uploads', req.user.id);
  if (!fs.existsSync(userFolder)) return res.json([]);

  const files = fs.readdirSync(userFolder);
  res.json(files);
});

// GET /api/files/download/:filename
router.get('/download/:filename', verifyToken, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.user.id, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
  res.download(filePath);
});

// DELETE /api/files/delete/:filename
router.delete('/delete/:filename', verifyToken, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.user.id, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

  fs.unlinkSync(filePath);
  res.json({ message: 'File deleted successfully' });
});

module.exports = router;
