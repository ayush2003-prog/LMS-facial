
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

// Borrow book
router.post('/', verifyToken, (req, res) => {
  const { bookId, dueDate } = req.body;
  const studentId = req.user.id;
  const db = req.app.locals.db;

  console.log('📚 Borrow request received:', { studentId, bookId, dueDate });

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('❌ Transaction start error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Check if book is available
    const checkBookQuery = 'SELECT id, title, available_quantity FROM books WHERE id = ? FOR UPDATE';
    db.query(checkBookQuery, [bookId], (err, bookResults) => {
      if (err) {
        console.error('❌ Check book error:', err);
        return db.rollback(() => {
          res.status(500).json({ success: false, message: 'Database error checking book availability' });
        });
      }

      if (bookResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ success: false, message: 'Book not found' });
        });
      }

      if (bookResults[0].available_quantity <= 0) {
        return db.rollback(() => {
          res.status(400).json({ success: false, message: 'Book not available for borrowing' });
        });
      }

      // Check student borrow limit
      const checkLimitQuery = 'SELECT COUNT(*) as borrowed_count FROM borrow_records WHERE student_id = ? AND is_returned = FALSE';
      db.query(checkLimitQuery, [studentId], (err, limitResults) => {
        if (err) {
          console.error('❌ Check limit error:', err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: 'Database error checking borrow limit' });
          });
        }

        if (limitResults[0].borrowed_count >= 3) {
          return db.rollback(() => {
            res.status(400).json({ success: false, message: 'Borrowing limit exceeded (maximum 3 books)' });
          });
        }

        // Insert borrow record
        const borrowQuery = `
          INSERT INTO borrow_records (student_id, book_id, due_date)
          VALUES (?, ?, ?)
        `;

        db.query(borrowQuery, [studentId, bookId, dueDate], (err, result) => {
          if (err) {
            console.error('❌ Insert borrow record error:', err);
            return db.rollback(() => {
              res.status(500).json({ success: false, message: 'Failed to create borrow record' });
            });
          }

          console.log('✅ Borrow record created:', result.insertId);

          // Update book availability
          const updateBookQuery = 'UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?';
          db.query(updateBookQuery, [bookId], (err, updateResult) => {
            if (err) {
              console.error('❌ Update book availability error:', err);
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Failed to update book availability' });
              });
            }

            console.log('✅ Book availability updated:', updateResult.affectedRows);

            // Update student statistics
            const updateStudentQuery = 'UPDATE students SET total_borrowed = total_borrowed + 1 WHERE id = ?';
            db.query(updateStudentQuery, [studentId], (err, studentUpdateResult) => {
              if (err) {
                console.error('❌ Update student stats error:', err);
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Failed to update student statistics' });
                });
              }

              console.log('✅ Student statistics updated:', studentUpdateResult.affectedRows);

              // Commit transaction
              db.commit((err) => {
                if (err) {
                  console.error('❌ Transaction commit error:', err);
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Transaction failed to commit' });
                  });
                }

                console.log('✅ Book borrowed successfully:', { 
                  borrowId: result.insertId, 
                  bookTitle: bookResults[0].title,
                  studentId 
                });

                res.status(201).json({ 
                  success: true, 
                  message: `Book "${bookResults[0].title}" borrowed successfully`,
                  borrowId: result.insertId,
                  dueDate: dueDate
                });
              });
            });
          });
        });
      });
    });
  });
});

// Return book
router.put('/:borrowId/return', verifyToken, (req, res) => {
  const borrowId = req.params.borrowId;
  const db = req.app.locals.db;

  console.log('📖 Return request received:', { borrowId });

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('❌ Return transaction start error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Get borrow record details
    const getBorrowQuery = `
      SELECT br.*, b.title, DATEDIFF(CURDATE(), br.due_date) as days_overdue
      FROM borrow_records br 
      JOIN books b ON br.book_id = b.id
      WHERE br.id = ? AND br.is_returned = FALSE
    `;

    db.query(getBorrowQuery, [borrowId], (err, borrowResults) => {
      if (err) {
        console.error('❌ Get borrow record error:', err);
        return db.rollback(() => {
          res.status(500).json({ success: false, message: 'Database error retrieving borrow record' });
        });
      }

      if (borrowResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ success: false, message: 'Borrow record not found or already returned' });
        });
      }

      const borrowRecord = borrowResults[0];
      let penaltyAmount = 0;

      // Calculate penalty if overdue
      if (borrowRecord.days_overdue > 0) {
        penaltyAmount = borrowRecord.days_overdue * 5; // ₹5 per day
      }

      // Update borrow record
      const updateBorrowQuery = `
        UPDATE borrow_records 
        SET is_returned = TRUE, return_date = CURRENT_TIMESTAMP, penalty_amount = ?, is_overdue = ?
        WHERE id = ?
      `;

      const isOverdue = borrowRecord.days_overdue > 0;

      db.query(updateBorrowQuery, [penaltyAmount, isOverdue, borrowId], (err) => {
        if (err) {
          console.error('❌ Update borrow record error:', err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: 'Failed to update borrow record' });
          });
        }

        // Update book availability
        const updateBookQuery = 'UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?';
        db.query(updateBookQuery, [borrowRecord.book_id], (err) => {
          if (err) {
            console.error('❌ Update book availability on return error:', err);
            return db.rollback(() => {
              res.status(500).json({ success: false, message: 'Failed to update book availability' });
            });
          }

          // Update student statistics
          const updateStudentQuery = `
            UPDATE students 
            SET total_returned = total_returned + 1, penalty_amount = penalty_amount + ?
            WHERE id = ?
          `;
          db.query(updateStudentQuery, [penaltyAmount, borrowRecord.student_id], (err) => {
            if (err) {
              console.error('❌ Update student stats on return error:', err);
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Failed to update student statistics' });
              });
            }

            // Add penalty record if applicable
            if (penaltyAmount > 0) {
              const penaltyQuery = `
                INSERT INTO penalty_records (student_id, borrow_record_id, penalty_type, penalty_amount, notes)
                VALUES (?, ?, 'overdue', ?, 'Late return penalty')
              `;
              db.query(penaltyQuery, [borrowRecord.student_id, borrowId, penaltyAmount], (err) => {
                if (err) {
                  console.error('❌ Insert penalty record error:', err);
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Failed to record penalty' });
                  });
                }

                // Commit transaction
                db.commit((err) => {
                  if (err) {
                    console.error('❌ Return transaction commit error:', err);
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: 'Transaction failed to commit' });
                    });
                  }

                  console.log('✅ Book returned with penalty:', { 
                    borrowId, 
                    bookTitle: borrowRecord.title,
                    penalty: penaltyAmount 
                  });

                  res.json({ 
                    success: true, 
                    message: `Book "${borrowRecord.title}" returned successfully`,
                    penalty: penaltyAmount
                  });
                });
              });
            } else {
              // Commit transaction (no penalty)
              db.commit((err) => {
                if (err) {
                  console.error('❌ Return transaction commit error (no penalty):', err);
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Transaction failed to commit' });
                  });
                }

                console.log('✅ Book returned successfully:', { 
                  borrowId, 
                  bookTitle: borrowRecord.title 
                });

                res.json({ 
                  success: true, 
                  message: `Book "${borrowRecord.title}" returned successfully`
                });
              });
            }
          });
        });
      });
    });
  });
});

// Get student borrowed books
router.get('/student/:studentId', verifyToken, (req, res) => {
  const studentId = req.params.studentId;
  const db = req.app.locals.db;

  // Ensure student can only access their own records (unless admin)
  if (req.user.userType !== 'admin' && req.user.id != studentId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const query = `
    SELECT 
      br.id as borrow_id,
      b.id as book_id,
      b.title,
      b.author,
      b.category,
      b.isbn,
      b.cover_image,
      br.borrow_date,
      br.due_date,
      br.penalty_amount,
      br.is_overdue,
      DATEDIFF(CURDATE(), br.due_date) as days_overdue
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.student_id = ? AND br.is_returned = FALSE
    ORDER BY br.borrow_date DESC
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('❌ Get student borrowed books error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Retrieved borrowed books for student:', studentId, 'Count:', results.length);
    res.json({ success: true, borrowedBooks: results });
  });
});

// Get borrow history
router.get('/history/:studentId', verifyToken, (req, res) => {
  const studentId = req.params.studentId;
  const db = req.app.locals.db;

  // Ensure student can only access their own records (unless admin)
  if (req.user.userType !== 'admin' && req.user.id != studentId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const query = `
    SELECT 
      br.id as borrow_id,
      b.title,
      b.author,
      b.category,
      br.borrow_date,
      br.due_date,
      br.return_date,
      br.is_returned,
      br.penalty_amount,
      br.is_overdue
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.student_id = ?
    ORDER BY br.borrow_date DESC
    LIMIT 50
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('❌ Get borrow history error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Retrieved borrow history for student:', studentId, 'Count:', results.length);
    res.json({ success: true, history: results });
  });
});

module.exports = router;
