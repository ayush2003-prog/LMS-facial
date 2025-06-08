
const express = require('express');
const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// Get all books
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  
  console.log('📚 Fetching all books from database...');
  
  const query = `
    SELECT 
      id, title, author, category, isbn, cover_image, description,
      total_quantity, available_quantity, date_added
    FROM books 
    ORDER BY title
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error fetching books:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Books fetched successfully:', results.length);
    res.json({ success: true, books: results });
  });
});

// Add new book (Admin only)
router.post('/', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required' });
  }
  
  const { title, author, category, isbn, coverImage, description, totalQuantity } = req.body;
  const db = req.app.locals.db;

  console.log('📚 Adding new book to database:', { title, author, category, isbn, totalQuantity, coverImage });

  // Validate required fields
  if (!title || !author || !category || !isbn || !totalQuantity) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO books (title, author, category, isbn, cover_image, description, total_quantity, available_quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [title, author, category, isbn, coverImage, description, totalQuantity, totalQuantity], (err, result) => {
    if (err) {
      console.error('❌ Database error adding book:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Book with this ISBN already exists' });
      }
      return res.status(500).json({ success: false, message: 'Failed to add book to database' });
    }

    console.log('✅ Book added successfully to database:', result.insertId);
    res.status(201).json({ 
      success: true, 
      message: 'Book added successfully',
      bookId: result.insertId 
    });
  });
});

// Update book (Admin only) - Fixed to properly handle available quantity
router.put('/:id', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required' });
  }
  
  const bookId = req.params.id;
  const { title, author, category, isbn, coverImage, description, totalQuantity } = req.body;
  const db = req.app.locals.db;

  console.log('📚 Updating book in database:', bookId);

  // First, get current book data and borrowed count
  const getCurrentDataQuery = `
    SELECT 
      total_quantity, 
      available_quantity,
      (SELECT COUNT(*) FROM borrow_records WHERE book_id = ? AND is_returned = FALSE) as currently_borrowed
    FROM books 
    WHERE id = ?
  `;

  db.query(getCurrentDataQuery, [bookId, bookId], (err, currentData) => {
    if (err) {
      console.error('❌ Database error getting current book data:', err);
      return res.status(500).json({ success: false, message: 'Failed to get current book data' });
    }

    if (currentData.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const currentBook = currentData[0];
    const currentlyBorrowed = currentBook.currently_borrowed;
    const newAvailableQuantity = totalQuantity - currentlyBorrowed;

    // Validate that new total quantity is not less than currently borrowed
    if (totalQuantity < currentlyBorrowed) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot set total quantity to ${totalQuantity}. ${currentlyBorrowed} books are currently borrowed.` 
      });
    }

    const updateQuery = `
      UPDATE books 
      SET title = ?, author = ?, category = ?, isbn = ?, cover_image = ?, description = ?, 
          total_quantity = ?, available_quantity = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [title, author, category, isbn, coverImage, description, totalQuantity, newAvailableQuantity, bookId], (err, result) => {
      if (err) {
        console.error('❌ Database error updating book:', err);
        return res.status(500).json({ success: false, message: 'Failed to update book in database' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      console.log('✅ Book updated successfully in database:', bookId);
      res.json({ 
        success: true, 
        message: 'Book updated successfully',
        newAvailableQuantity: newAvailableQuantity
      });
    });
  });
});

// Delete book (Admin only)
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin privileges required' });
  }
  
  const bookId = req.params.id;
  const db = req.app.locals.db;

  console.log('🗑️ Deleting book from database:', bookId);

  const query = 'DELETE FROM books WHERE id = ?';
  db.query(query, [bookId], (err, result) => {
    if (err) {
      console.error('❌ Database error deleting book:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete book from database' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    console.log('✅ Book deleted successfully from database:', bookId);
    res.json({ success: true, message: 'Book deleted successfully' });
  });
});

// Get trending books (most borrowed)
router.get('/trending', (req, res) => {
  const db = req.app.locals.db;
  
  console.log('📈 Fetching trending books...');
  
  const query = `
    SELECT 
      b.id, b.title, b.author, b.category, b.cover_image, b.description,
      COUNT(br.id) as borrow_count
    FROM books b
    LEFT JOIN borrow_records br ON b.id = br.book_id
    GROUP BY b.id
    ORDER BY borrow_count DESC, b.title
    LIMIT 10
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error fetching trending books:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Trending books fetched successfully:', results.length);
    res.json({ success: true, books: results });
  });
});

module.exports = router;
