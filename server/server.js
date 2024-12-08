const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'social_app'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');

  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      handle VARCHAR(255) UNIQUE NOT NULL,
      bio TEXT,
      avatar VARCHAR(255) DEFAULT '/api/placeholder/150/150',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  // Create posts table
  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      media VARCHAR(255),
      tags VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;

  // Create likes table
  const createLikesTable = `
    CREATE TABLE IF NOT EXISTS likes (
      user_id INT NOT NULL,
      post_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )`;

  // Create comments table
  const createCommentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;

  // Execute table creation queries sequentially
  db.query(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
      return;
    }
    console.log('Users table created successfully');

    db.query(createPostsTable, (err) => {
      if (err) {
        console.error('Error creating posts table:', err);
        return;
      }
      console.log('Posts table created successfully');

      db.query(createLikesTable, (err) => {
        if (err) {
          console.error('Error creating likes table:', err);
          return;
        }
        console.log('Likes table created successfully');

        db.query(createCommentsTable, (err) => {
          if (err) {
            console.error('Error creating comments table:', err);
            return;
          }
          console.log('Comments table created successfully');
        });
      });
    });
  });
});

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  const { name, email, password, handle } = req.body;
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const query = 'INSERT INTO users (name, email, password, handle) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, hashedPassword, handle], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'User already exists' });
        }
        return res.status(500).json({ message: 'Server error' });
      }

      const token = jwt.sign(
        { userId: result.insertId },
        process.env.JWT_SECRET || 'secret123',
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: result.insertId, name, handle } });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, handle: user.handle } });
  });
});

// Post Routes
app.get('/api/posts', auth, (req, res) => {
  const query = `
    SELECT 
      p.*, 
      u.name, 
      u.handle, 
      u.avatar,
      COUNT(DISTINCT l.user_id) as likes_count,
      COUNT(DISTINCT c.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.query(query, [req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    const posts = results.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',') : [],
      is_liked: !!post.is_liked
    }));
    
    res.json(posts);
  });
});

app.post('/api/posts', auth, (req, res) => {
  const { content, media, tags } = req.body;
  const userId = req.user.userId;

  const query = 'INSERT INTO posts (user_id, content, media, tags) VALUES (?, ?, ?, ?)';
  db.query(query, [userId, content, media, tags.join(',')], (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    // Fetch the created post with user details
    const fetchQuery = `
      SELECT 
        p.*, 
        u.name, 
        u.handle, 
        u.avatar,
        0 as likes_count,
        0 as comments_count,
        false as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    db.query(fetchQuery, [result.insertId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      const post = {
        ...results[0],
        tags: results[0].tags ? results[0].tags.split(',') : []
      };

      res.json(post);
    });
  });
});

app.delete('/api/posts/:id', auth, (req, res) => {
  const query = 'DELETE FROM posts WHERE id = ? AND user_id = ?';
  
  db.query(query, [req.params.id, req.user.userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  });
});

// Like Routes
app.post('/api/posts/:id/like', auth, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  db.query('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (results.length > 0) {
      // Unlike
      db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId], (err) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ liked: false });
      });
    } else {
      // Like
      db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId], (err) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ liked: true });
      });
    }
  });
});

// Comment Routes
app.get('/api/posts/:id/comments', auth, (req, res) => {
  const query = `
    SELECT 
      c.*,
      u.name,
      u.handle,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
  `;

  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
});

app.post('/api/posts/:id/comments', auth, (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  const userId = req.user.userId;

  const query = `
    INSERT INTO comments (post_id, user_id, content)
    VALUES (?, ?, ?)
  `;

  db.query(query, [postId, userId, content], (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    // Fetch the created comment with user details
    const fetchQuery = `
      SELECT 
        c.*,
        u.name,
        u.handle,
        u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;

    db.query(fetchQuery, [result.insertId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(results[0]);
    });
  });
});

app.delete('/api/comments/:id', auth, (req, res) => {
  const query = `
    DELETE FROM comments 
    WHERE id = ? AND user_id = ?
  `;

  db.query(query, [req.params.id, req.user.userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  });
});

// Single Post Route with Comments
app.get('/api/posts/:id', auth, (req, res) => {
  const postQuery = `
    SELECT 
      p.*, 
      u.name, 
      u.handle, 
      u.avatar,
      COUNT(DISTINCT l.user_id) as likes_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  const commentsQuery = `
    SELECT 
      c.*,
      u.name,
      u.handle,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
  `;

  db.query(postQuery, [req.user.userId, req.params.id], (err, postResults) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (postResults.length === 0) return res.status(404).json({ message: 'Post not found' });

    const post = {
      ...postResults[0],
      tags: postResults[0].tags ? postResults[0].tags.split(',') : [],
      is_liked: !!postResults[0].is_liked
    };

    db.query(commentsQuery, [req.params.id], (err, commentResults) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      
      post.comments = commentResults;
      res.json(post);
    });
  });
});

// User Profile Routes
app.get('/api/users/:handle', auth, (req, res) => {
  const query = `
    SELECT 
      id, 
      name, 
      handle, 
      bio, 
      avatar,
      created_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as posts_count,
      (SELECT COUNT(*) FROM likes WHERE user_id = users.id) as likes_given_count
    FROM users 
    WHERE handle = ?
  `;
  
  db.query(query, [req.params.handle], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    
    res.json(results[0]);
  });
});

app.get('/api/users/:handle/posts', auth, (req, res) => {
  const query = `
    SELECT 
      p.*, 
      u.name, 
      u.handle, 
      u.avatar,
      COUNT(DISTINCT l.user_id) as likes_count,
      COUNT(DISTINCT c.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE u.handle = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.query(query, [req.user.userId, req.params.handle], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    const posts = results.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',') : [],
      is_liked: !!post.is_liked
    }));
    
    res.json(posts);
  });
});

app.put('/api/profile', auth, (req, res) => {
  const { name, bio } = req.body;
  const query = 'UPDATE users SET name = ?, bio = ? WHERE id = ?';
  
  db.query(query, [name, bio, req.user.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    res.json({ message: 'Profile updated successfully' });
  });
});

app.put('/api/profile/avatar', auth, (req, res) => {
  const { avatar } = req.body;
  const query = 'UPDATE users SET avatar = ? WHERE id = ?';
  
  db.query(query, [avatar, req.user.userId], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    res.json({ message: 'Avatar updated successfully' });
  });
});

app.get('/api/users/me', auth, (req, res) => {
    const query = `
      SELECT 
        id,
        name,
        handle,
        email,
        bio,
        avatar,
        created_at
      FROM users 
      WHERE id = ?
    `;
    
    db.query(query, [req.user.userId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length === 0) return res.status(404).json({ message: 'User not found' });
      
      res.json(results[0]);
    });
  });
  
// Search Routes
app.get('/api/search/users', auth, (req, res) => {
  const { q } = req.query;
  const query = `
    SELECT id, name, handle, avatar, bio
    FROM users
    WHERE name LIKE ? OR handle LIKE ?
    LIMIT 20
  `;
  
  const searchTerm = `%${q}%`;
  db.query(query, [searchTerm, searchTerm], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
});

app.get('/api/search/posts', auth, (req, res) => {
  const { q } = req.query;
  const query = `
    SELECT 
      p.*, 
      u.name, 
      u.handle, 
      u.avatar,
      COUNT(DISTINCT l.user_id) as likes_count,
      COUNT(DISTINCT c.id) as comments_count,
      EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE p.content LIKE ? OR p.tags LIKE ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 50
  `;
  
  const searchTerm = `%${q}%`;
  db.query(query, [req.user.userId, searchTerm, searchTerm], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    const posts = results.map(post => ({
      ...post,
      tags: post.tags ? post.tags.split(',') : [],
      is_liked: !!post.is_liked
    }));
    
    res.json(posts);
  });
});

// Trending Routes
app.get('/api/trending/tags', auth, (req, res) => {
  const query = `
    SELECT 
      SUBSTRING_INDEX(SUBSTRING_INDEX(p.tags, ',', numbers.n), ',', -1) as tag,
      COUNT(*) as count
    FROM 
      posts p
      JOIN (
        SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
      ) numbers ON CHAR_LENGTH(p.tags) - CHAR_LENGTH(REPLACE(p.tags, ',', '')) >= numbers.n - 1
    WHERE 
      p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND SUBSTRING_INDEX(SUBSTRING_INDEX(p.tags, ',', numbers.n), ',', -1) != ''
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});