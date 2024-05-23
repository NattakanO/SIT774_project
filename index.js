const express = require("express");
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('projectDB.db');
var app = express();

app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }));
app.use(morgan('common'));

const secretKey = 'SecretKey1234567890';
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true
}));

app.get('/index.js', function(req, res) {
  res.sendFile(__dirname + '/index.js');
});
//home page
app.get('/', (req, res, next) => {
  const query = `SELECT * FROM Books`;
  db.all(query, (err, rows) => {
      if (err) {
          console.error('Error querying database:', err);
          return;
      }
      
      db.all('SELECT * FROM Bestsellers as bs JOIN Books as b on b.book_id = bs.book_id ', (err, bestseller) => {
        if (err) {
            console.error('Error querying database:', err);
            return;
        }
        
        res.render('books', { books:rows , username: req.session.username, bestseller:bestseller});
    });
  });
});

//register
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register', async (req, res) => {
  const { username, password, email, firstName, lastName, phoneNumber } = req.body;

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (username, password_hash, email, first_name, last_name, phone_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  db.run(query, [username, passwordHash, email, firstName, lastName, phoneNumber, createdAt, updatedAt], async function (err) {
      if (err) {
          console.error('Error inserting user into database:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      // Send email to the user
      try {
          const transporter = nodemailer.createTransport();

          await transporter.sendMail({
              from: 'nattakan.ty3090@gmail.com',
              to: email,
              subject: 'Welcome to Our Website',
              text: 'Thank you for registering!'
          });

          console.log('Email sent successfully');
      } catch (error) {
          console.error('Error sending email:', error);
      }
      req.session.username = username;
      req.session.user_id = this.lastID;
      res.redirect('/');
  });
});

//show all users - json format
app.get('/users', (req, res) => {
  const query = 'SELECT * FROM Users ';
  db.all(query, (err, row) => {
      if (err) {
          console.error('Error querying database:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      if (row) {
          res.json(row);
      } else {
          res.render('login', { errorMessage: 'Invalid username or password' });
      }
  });
});

//login
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null });
});
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM Users WHERE username = ?';
  db.get(query, [username], async(err, row) => {
      if (err) {
          console.error('Error querying database:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      if (row) {
        try {
            const passwordMatch = await bcrypt.compare(password, row.password_hash);
            if (passwordMatch) {
                // Passwords match, login successful
                req.session.username = username;
                req.session.user_id = row.user_id
                res.redirect('/');
            } else {
    
                res.render('login', { errorMessage: 'Invalid username or password' });
            }
        } catch (error) {
            console.error('Error comparing passwords:', error);
            res.status(500).send('Internal Server Error');
          }} else {

            res.render('login', { errorMessage: 'Invalid username or password' });
        }
  });
});
//log out
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error('Error destroying session:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      res.redirect('/login');
  });
});

//profile page
app.get('/profile', (req, res) => {
  const query = `SELECT * FROM Users WHERE user_id = ${req.session.user_id}`;
  db.all(query, (err, row) => {
      if (err) {
          console.error('Error querying database:', err);
          return;
      }
      console.log(row)
      res.render('profile', { user: row[0] , username: req.session.username});
  });
});

app.get('/cart', (req, res) => {
  // const query = `SELECT * FROM Users WHERE user_id = ${req.session.user_id}`;
  // db.all(query, (err, row) => {
  //     if (err) {
  //         console.error('Error querying database:', err);
  //         return;
  //     }
  //     console.log(row)
      res.render('cart', {username: req.session.username});
  // });
});


app.post('/feedback', (req, res) => {
  const { name, rating, feedback, icecreamtype } = req.body;
  db.run("INSERT INTO feedback (name, icecreamtype, rating, feedback) VALUES (?, ?, ?, ?)", [name, icecreamtype, rating, feedback], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.render('feedback', { 
      title: 'Feedback',
      icecreamtype: icecreamtype, 
      feedback: feedback,
      rating: rating,
      name: name
      });
  });
});

app.get('/feedback', (req, res) => {
  db.all("SELECT * FROM feedback", (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.render('comment', { 
      title: 'Comment List',
      data: result, 
      });
  });
});

app.get('/books', (req, res) => {
  db.all("SELECT * FROM books", (err, result) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.render('books', { 
      title: 'Books',
      data: result, 
      });
  });
});

//book information
app.get('/bookdetail/:book_id', (req, res) => {
  const book_id = req.params.book_id;
  const query = `SELECT * FROM Books WHERE book_id = ${book_id}`;
  db.all(query,function(err, bookdetail) {
    if (err) {
      return res.status(500).send(err.message);
    }
    console.log(bookdetail[0])
    db.all(`SELECT * FROM Books WHERE book_id != ${bookdetail[0].book_id} and genre = "${bookdetail[0].genre}" LIMIT 10`,function(err, books) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.render('bookDetail', { 
        title: bookdetail[0].title,
        book: bookdetail[0], 
        books: books,
        username: req.session.username
        });
    });
  });
});
app.post('/search', (req, res) => {
  const { search } = req.body;
  const query = `SELECT * FROM feedback WHERE icecreamtype LIKE '%${search}%'`;
  db.all(query,function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.render('comment', { 
      title: 'Search Results',
      data: result, 
      search: search
      });
  });
});

app.use(express.static('public_html'));

app.listen(3000, function(){
  console.log("Web server running at: http://localhost:3000");
  console.log("Type Ctrl + C to shut dowm the web server");
});