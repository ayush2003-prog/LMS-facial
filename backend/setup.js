
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database setup script
const setupDatabase = async () => {
  console.log('Setting up library management system database...');
  
  // Create connection without database first
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    timezone: '+00:00'
  });

  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'library_management_system';
    await new Promise((resolve, reject) => {
      connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log(`Database '${dbName}' created or already exists.`);
    
    // Switch to the database
    await new Promise((resolve, reject) => {
      connection.query(`USE ${dbName}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create tables
    const tables = [
      // Students table
      `CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        course VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        total_borrowed INT DEFAULT 0,
        total_returned INT DEFAULT 0,
        penalty_amount DECIMAL(10,2) DEFAULT 0.00,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )`,
      
      // Admin users table
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Books table
      `CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        isbn VARCHAR(20) UNIQUE NOT NULL,
        cover_image TEXT,
        description TEXT,
        total_quantity INT NOT NULL DEFAULT 1,
        available_quantity INT NOT NULL DEFAULT 1,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Borrow records table
      `CREATE TABLE IF NOT EXISTS borrow_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        book_id INT NOT NULL,
        borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date DATE NOT NULL,
        return_date TIMESTAMP NULL,
        is_returned BOOLEAN DEFAULT FALSE,
        is_overdue BOOLEAN DEFAULT FALSE,
        penalty_amount DECIMAL(10,2) DEFAULT 0.00,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      )`,
      
      // Penalty records table
      `CREATE TABLE IF NOT EXISTS penalty_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        borrow_record_id INT NOT NULL,
        penalty_type VARCHAR(50) NOT NULL,
        penalty_amount DECIMAL(10,2) NOT NULL,
        penalty_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_paid BOOLEAN DEFAULT FALSE,
        payment_date TIMESTAMP NULL,
        notes TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (borrow_record_id) REFERENCES borrow_records(id) ON DELETE CASCADE
      )`,

      // Student favorites table
      `CREATE TABLE IF NOT EXISTS student_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        book_id INT NOT NULL,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_book (student_id, book_id)
      )`
    ];

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        connection.query(table, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('All tables created successfully.');

    // Hash the admin password properly
    const adminPassword = await bcrypt.hash('admin123', 10);
    const insertAdmin = `
      INSERT INTO admin_users (email, password, full_name, role) 
      VALUES ('admin@gmail.com', ?, 'System Administrator', 'admin')
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `;
    
    await new Promise((resolve, reject) => {
      connection.query(insertAdmin, [adminPassword], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('Default admin user created/updated (admin@gmail.com / admin123)');

    // Add some sample books
    const sampleBooks = [
      ['The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', '978-0-7432-7356-5', '', 'A classic American novel', 5, 5],
      ['To Kill a Mockingbird', 'Harper Lee', 'Fiction', '978-0-06-112008-4', '', 'A gripping tale of racial injustice', 3, 3],
      ['1984', 'George Orwell', 'Science Fiction', '978-0-452-28423-4', '', 'A dystopian social science fiction novel', 4, 4],
      ['Pride and Prejudice', 'Jane Austen', 'Romance', '978-0-14-143951-8', '', 'A romantic novel of manners', 2, 2],
      ['The Catcher in the Rye', 'J.D. Salinger', 'Fiction', '978-0-316-76948-0', '', 'A controversial novel about teenage rebellion', 3, 3]
    ];

    const insertBooks = `
      INSERT IGNORE INTO books (title, author, category, isbn, cover_image, description, total_quantity, available_quantity)
      VALUES ?
    `;

    await new Promise((resolve, reject) => {
      connection.query(insertBooks, [sampleBooks], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('Sample books added successfully.');
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    connection.end();
  }
};

setupDatabase();
