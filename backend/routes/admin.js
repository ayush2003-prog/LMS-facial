
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// Admin login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  console.log('👨‍💼 Admin login attempt:', email);

  const query = 'SELECT id, email, password, full_name, role, is_active FROM admin_users WHERE email = ?';
  
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('❌ Database error during admin login:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const admin = results[0];

    if (!admin.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Update last login
      const updateLoginQuery = 'UPDATE admin_users SET last_login = NOW() WHERE id = ?';
      db.query(updateLoginQuery, [admin.id], (updateErr) => {
        if (updateErr) {
          console.error('❌ Failed to update last login:', updateErr);
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          userType: 'admin',
          role: admin.role
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
      );

      console.log('✅ Admin login successful:', admin.id);
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name,
          role: admin.role,
          userType: 'admin'
        }
      });
    } catch (error) {
      console.error('❌ Password verification error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });
});

// Get dashboard statistics
router.get('/dashboard/stats', verifyAdminToken, (req, res) => {
  const db = req.app.locals.db;
  
  console.log('📊 Fetching admin dashboard stats...');
  
  // Execute multiple queries to get comprehensive stats
  const queries = {
    totalBooks: 'SELECT COUNT(*) as count FROM books',
    totalStudents: 'SELECT COUNT(*) as count FROM students WHERE is_active = TRUE',
    totalBorrowed: 'SELECT COUNT(*) as count FROM borrow_records WHERE is_returned = FALSE',
    totalOverdue: `
      SELECT COUNT(*) as count FROM borrow_records 
      WHERE is_returned = FALSE AND due_date < CURDATE()
    `,
    totalPenalties: 'SELECT COALESCE(SUM(penalty_amount), 0) as total FROM penalty_records WHERE is_paid = FALSE'
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, queryResults) => {
      if (err) {
        console.error(`❌ Error in query ${key}:`, err);
        results[key] = 0;
      } else {
        results[key] = key === 'totalPenalties' ? queryResults[0].total : queryResults[0].count;
      }
      
      completed++;
      if (completed === totalQueries) {
        console.log('✅ Dashboard stats fetched:', results);
        res.json({ success: true, stats: results });
      }
    });
  });
});

// Get all students
router.get('/students', verifyAdminToken, (req, res) => {
  const db = req.app.locals.db;
  
  console.log('👨‍🎓 Fetching all students...');
  
  const query = `
    SELECT 
      s.id, s.college_id, s.full_name, s.email, s.course, s.is_active,
      s.registration_date, s.total_borrowed, s.total_returned, s.penalty_amount,
      COUNT(br.id) as current_borrowed
    FROM students s
    LEFT JOIN borrow_records br ON s.id = br.student_id AND br.is_returned = FALSE
    GROUP BY s.id
    ORDER BY s.registration_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error fetching students:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Students fetched successfully:', results.length);
    res.json({ success: true, students: results });
  });
});

// Toggle student status
router.put('/students/:id/toggle-status', verifyAdminToken, (req, res) => {
  const studentId = req.params.id;
  const db = req.app.locals.db;

  console.log('👨‍🎓 Toggling student status:', studentId);

  const query = 'UPDATE students SET is_active = NOT is_active WHERE id = ?';
  
  db.query(query, [studentId], (err, result) => {
    if (err) {
      console.error('❌ Database error toggling student status:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    console.log('✅ Student status toggled successfully');
    res.json({ success: true, message: 'Student status updated successfully' });
  });
});

// Get all borrowed books
router.get('/borrowed-books', verifyAdminToken, (req, res) => {
  const db = req.app.locals.db;
  
  console.log('📖 Fetching all borrowed books...');
  
  const query = `
    SELECT 
      br.id as borrow_id, br.borrow_date, br.due_date, br.is_returned, br.is_overdue,
      br.penalty_amount,
      b.title, b.author, b.isbn,
      s.college_id, s.full_name as student_name, s.email as student_email,
      CASE 
        WHEN br.due_date < CURDATE() AND br.is_returned = FALSE THEN DATEDIFF(CURDATE(), br.due_date)
        ELSE 0 
      END as days_overdue
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    JOIN students s ON br.student_id = s.id
    WHERE br.is_returned = FALSE
    ORDER BY br.borrow_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error fetching borrowed books:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Borrowed books fetched successfully:', results.length);
    res.json({ success: true, borrowedBooks: results });
  });
});

// Get penalties
router.get('/penalties', verifyAdminToken, (req, res) => {
  const db = req.app.locals.db;
  
  console.log('💰 Fetching penalty information...');
  
  const query = `
    SELECT 
      pr.id, pr.penalty_amount, pr.penalty_date, pr.is_paid, pr.payment_date, pr.notes,
      s.college_id, s.full_name as student_name, s.email as student_email,
      b.title, b.author
    FROM penalty_records pr
    JOIN students s ON pr.student_id = s.id
    JOIN borrow_records br ON pr.borrow_record_id = br.id
    JOIN books b ON br.book_id = b.id
    ORDER BY pr.penalty_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Database error fetching penalties:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Penalties fetched successfully:', results.length);
    res.json({ success: true, penalties: results });
  });
});

// Clear penalty
router.put('/penalties/:studentId/clear', verifyAdminToken, (req, res) => {
  const studentId = req.params.studentId;
  const db = req.app.locals.db;

  console.log('💰 Clearing penalty for student:', studentId);

  const queries = [
    'UPDATE penalty_records SET is_paid = TRUE, payment_date = NOW() WHERE student_id = ? AND is_paid = FALSE',
    'UPDATE students SET penalty_amount = 0 WHERE id = ?'
  ];

  let completed = 0;
  queries.forEach((query) => {
    db.query(query, [studentId], (err, result) => {
      if (err) {
        console.error('❌ Database error clearing penalty:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      completed++;
      if (completed === queries.length) {
        console.log('✅ Penalty cleared successfully');
        res.json({ success: true, message: 'Penalty cleared successfully' });
      }
    });
  });
});

// Get library report data
router.get('/reports/library', verifyAdminToken, (req, res) => {
  const db = req.app.locals.db;
  
  console.log('📊 Generating library report data...');
  
  const reportQueries = {
    // Basic statistics
    totalBooks: 'SELECT COUNT(*) as count FROM books',
    totalStudents: 'SELECT COUNT(*) as count FROM students WHERE is_active = TRUE',
    booksIssued: 'SELECT COUNT(*) as count FROM borrow_records WHERE is_returned = FALSE',
    overdueBooks: 'SELECT COUNT(*) as count FROM borrow_records WHERE is_returned = FALSE AND due_date < CURDATE()',
    totalPenalties: 'SELECT COALESCE(SUM(penalty_amount), 0) as total FROM penalty_records WHERE is_paid = FALSE',
    
    // Category distribution
    categoryDistribution: `
      SELECT category, COUNT(*) as count 
      FROM books 
      GROUP BY category 
      ORDER BY count DESC
    `,
    
    // Weekly borrowing trend (last 8 weeks)
    weeklyBorrowingTrend: `
      SELECT 
        CONCAT('Week ', WEEK(borrow_date, 1) - WEEK(CURDATE() - INTERVAL 8 WEEK, 1) + 1) as week,
        DATE_FORMAT(borrow_date, '%Y-%m-%d') as date,
        COUNT(*) as borrowed,
        SUM(CASE WHEN is_returned = TRUE THEN 1 ELSE 0 END) as returned
      FROM borrow_records 
      WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
      GROUP BY WEEK(borrow_date, 1), DATE(borrow_date)
      ORDER BY borrow_date
    `,
    
    // Top borrowed books
    topBorrowedBooks: `
      SELECT 
        b.title, b.author, COUNT(br.id) as borrowCount
      FROM books b
      LEFT JOIN borrow_records br ON b.id = br.book_id
      GROUP BY b.id, b.title, b.author
      ORDER BY borrowCount DESC
      LIMIT 10
    `
  };

  const reportData = {};
  let completed = 0;
  const totalQueries = Object.keys(reportQueries).length;

  Object.entries(reportQueries).forEach(([key, query]) => {
    db.query(query, (err, results) => {
      if (err) {
        console.error(`❌ Error in report query ${key}:`, err);
        reportData[key] = key.includes('Distribution') || key.includes('Trend') || key.includes('Books') ? [] : 0;
      } else {
        if (key === 'totalPenalties') {
          reportData[key] = results[0].total;
        } else if (key.includes('Distribution') || key.includes('Trend') || key.includes('Books')) {
          reportData[key] = results;
        } else {
          reportData[key] = results[0].count;
        }
      }
      
      completed++;
      if (completed === totalQueries) {
        console.log('✅ Library report data generated successfully');
        res.json({ success: true, reportData });
      }
    });
  });
});

// Download library report (mock endpoint)
router.get('/reports/download', verifyAdminToken, (req, res) => {
  console.log('📥 Library report download requested');
  
  // This is a mock response - in a real implementation, you would generate a PDF
  res.json({ 
    success: true, 
    message: 'Report download feature coming soon',
    reportUrl: '#' 
  });
});

module.exports = router;
