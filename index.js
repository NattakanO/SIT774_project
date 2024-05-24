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

function IsLoggedin(req, res, next) {
  if (req.session.user_id) {
      return next();
  }
  res.redirect('/login');
}

app.get('/index.js', function(req, res) {
  res.sendFile(__dirname + '/index.js');
});
//home page
app.get('/', (req, res, next) => {
  res.render('index', {  username: req.session.username, loginSuccess:false});
});
app.get('/books', (req, res, next) => {
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
        
        res.render('books', { books:rows , username: req.session.username, bestseller:bestseller, search: ""});
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
  res.render('login', { errorMessage: null});
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
          req.session.username = username;
          req.session.user_id = row.user_id;
          res.render('index', { loginSuccess: true ,errorMessage: null, username:req.session.username});
          return;
        }
      } catch (error) {
        console.error('Error comparing passwords:', error);
        res.status(500).send('Internal Server Error');
        return;
      }
    }
    res.render('login', { errorMessage: 'Invalid username or password' });
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

app.get('/cart', IsLoggedin,(req, res) => {
  const userId = req.session.user_id;
  const query = `
    SELECT ci.cart_item_id,ci.cart_id, b.title, b.price, b.cover_image_url, ci.quantity
    FROM CartItems ci
    JOIN Books b ON ci.book_id = b.book_id
    JOIN ShoppingCart sc ON ci.cart_id = sc.cart_id
    WHERE sc.user_id = ?;
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log(rows)
    res.render('cart', { cartItems: rows , username: req.session.username});
  });
});

app.post('/cart/remove/:cartItemId', (req, res) => {
  const cartItemId = req.params.cartItemId;
  const query = 'DELETE FROM CartItems WHERE cart_item_id = ?';

  db.run(query, [cartItemId], (err) => {
    if (err) {
      console.error('Error removing item from cart:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.redirect('/cart');
  });
});

app.post('/add-to-cart', IsLoggedin, (req, res) => {
  const userId = req.session.user_id;
  const { book_id, quantity} = req.body;

  // Check if the user already has a shopping cart
  db.get('SELECT cart_id FROM ShoppingCart WHERE user_id = ?', [userId], (err, cart) => {
    if (err) {
      console.error('Error querying shopping cart:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (cart) {
      // If the cart exists, add the item to CartItems
      addItemToCart(cart.cart_id, book_id, quantity);
    } else {
      // If no cart exists, create a new one and then add the item
      db.run('INSERT INTO ShoppingCart (user_id) VALUES (?)', [userId], function (err) {
        if (err) {
          console.error('Error creating shopping cart:', err);
          res.status(500).send('Internal Server Error');
          return;
        }else{
          console.log('Create a new Cart successfully!')
        }
        addItemToCart(this.lastID,book_id, quantity);
      });
      }
  });

  function addItemToCart(cartId, bookId, quantity) {
      // Check if the book is already in the cart
    db.get('SELECT * FROM CartItems WHERE cart_id = ? AND book_id = ?', [cartId, bookId], (err, cartItem) => {
      if (err) {
        console.error('Error querying cart items:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      if (cartItem) {
        // If the item is already in the cart, update the quantity
        db.run(
          'UPDATE CartItems SET quantity = quantity + ? WHERE cart_item_id = ?',
          [quantity, cartItem.cart_item_id],
          (err) => {
            if (err) {
              console.error('Error updating cart item:', err);
              res.status(500).send('Internal Server Error');
              return;
            }
            res.redirect('/cart');
          }
        );
        } else {
              // If the item is not in the cart, insert it
            db.run(
              'INSERT INTO CartItems (cart_id, book_id, quantity) VALUES (?, ?, ?)',
              [cartId, bookId, quantity],
              (err) => {
                if (err) {
                  console.error('Error adding item to cart:', err);
                  res.status(500).send('Internal Server Error');
                  return;
                }
                res.redirect('/cart');
              }
            );
          }
    });
  }
});

app.post('/cart/update/:cart_item_id', IsLoggedin, (req, res) => {
  const { cart_item_id } = req.params;
  const { operation } = req.body;

  // Get the current quantity of the cart item
  db.get('SELECT quantity FROM CartItems WHERE cart_item_id = ?', [cart_item_id], (err, item) => {
    if (err) {
      console.error('Error querying cart item:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (item) {
      let newQuantity = item.quantity;
      if (operation === 'increase') {
        newQuantity += 1;
      } else if (operation === 'decrease') {
        newQuantity -= 1;
        if (newQuantity < 1) {
          newQuantity = 1; 
        }
      }

      db.run('UPDATE CartItems SET quantity = ? WHERE cart_item_id = ?', [newQuantity, cart_item_id], (err) => {
        if (err) {
          console.error('Error updating cart item quantity:', err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.redirect('/cart');
      });
    } else {
        res.status(404).send('Cart item not found');
    }
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
      db.all(`SELECT * FROM UserReviews as ur JOIN users as u ON u.user_id = ur.user_id WHERE book_id == ${bookdetail[0].book_id}`,function(err, reviews) {
        if (err) {
          return res.status(500).send(err.message);
        }
        res.render('bookDetail', { 
          title: bookdetail[0].title,
          book: bookdetail[0], 
          books: books,
          username: req.session.username,
          reviews: reviews
          });
      });
    });

  });
});

app.post('/checkout/:cart_id', IsLoggedin, async (req, res) => {
  const {cart_id} = req.params;
  console.log(`cart_id = ${cart_id}`)
  const userId = req.session.user_id;
  db.all('SELECT * FROM CartItems INNER JOIN Books ON CartItems.book_id = Books.book_id WHERE cart_id = ?', [cart_id], (err, items) => {
      if (err) {
          console.error('Error querying cart items:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      let totalAmount = 0;
      items.forEach(item => {
          totalAmount += item.quantity * item.price;
      });

      // Create new order
      const orderDate = new Date().toISOString();
      const status = 'Pending';

      const orderQuery = `INSERT INTO Orders (user_id, order_date, status, total_amount) VALUES (?, ?, ?, ?)`;
      db.run(orderQuery, [userId, orderDate, status, totalAmount], function (err) {
          if (err) {
              console.error('Error inserting order into database:', err);
              res.status(500).send('Internal Server Error');
              return;
          }

          const orderId = this.lastID;

          // Insert cart items into OrderItems and remove from CartItems
          const orderItemsQuery = `INSERT INTO OrderItems (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)`;
          items.forEach(item => {
              db.run(orderItemsQuery, [orderId, item.book_id, item.quantity, item.price], function(err) {
                  if (err) {
                      console.error('Error inserting order item into database:', err);
                      return;
                  }
                  console.log(`${item.book_id} is be recorded`)
              });
          });
          db.run('DELETE FROM ShoppingCart WHERE user_id = ?', [userId], function(err) {
              if (err) {
                  console.error('Error clearing cart items:', err);
                  return;
              }
              console.log('Cart items cleared successfully');
          });
          res.redirect(`/orders`);
      });
  });
});

//order detail
app.get('/order/:orderId', IsLoggedin, (req, res) => {
  const { orderId } = req.params;

  db.get('SELECT * FROM Orders WHERE order_id = ?', [orderId], (err, order) => {
    if (err) {
      console.error('Error querying order:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (!order) {
      res.status(404).send('Order not found');
      return;
    }

    db.all('SELECT OrderItems.*, Books.title, Books.cover_image_url FROM OrderItems INNER JOIN Books ON OrderItems.book_id = Books.book_id WHERE order_id = ?', [orderId], (err, orderItems) => {
      if (err) {
        console.error('Error querying order items:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      console.log(orderItems)
      if(order.status == 'Pending'){
        res.render('shipping', {
          order,
          orderItems,
          username: req.session.username
        });
      }else if(order.status == 'Waiting for payment'){
        res.render('payment', {
          order,
          orderItems,
          username: req.session.username
        });
      }
      
    });
  });
});

//order list
app.get('/orders', IsLoggedin, (req, res) => {
  const userId = req.session.user_id;
  db.all('SELECT * FROM Orders WHERE user_id = ?', [userId], (err, orders) => {
      if (err) {
          console.error('Error querying orders:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      res.render('order', { orders, username: req.session.username });
  });
});
app.get('/orderJson', (req, res) => {
  // const userId = req.session.user_id;
  db.all('SELECT * FROM Orders', (err, orders) => {
      if (err) {
          console.error('Error querying orders:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      res.json(orders)
  });
});
app.get('/shippingJson', (req, res) => {
  // const userId = req.session.user_id;
  db.all('SELECT * FROM ShippingAddresses', (err, orders) => {
      if (err) {
          console.error('Error querying orders:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      res.json(orders)
  });
});

//shipping information
app.post('/process-shipping/:order_id', (req, res) => {
  const query = `INSERT INTO ShippingAddresses (order_id, address_line1, city, state, postal_code, country, phone_number) VALUES ( ?, ?, ?, ?, ?, ?, ?)`;

  const { addressLine1, city, state, postalCode, country, phoneNumber } = req.body;
  const { order_id } = req.params; 
  db.run(query, [order_id, addressLine1, city, state, postalCode, country, phoneNumber], function (err) {
    if (err) {
      console.error('Error inserting order into database:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    db.run(`UPDATE Orders SET status = 'Waiting for payment', shipping_id = ${this.lastID} WHERE order_id = ${order_id};`, function(err){
      console.log('Update order status succesfully!!')
      res.redirect(`/order/${order_id}`)
      // res.render('payment', {username: req.session.username});
    })
  });
});

//payment
app.post('/process-payment/:order_id', (req, res) => {
  const { cardNumber, cardHolderName, expiryDate, cvv, paymentMethod } = req.body;
  const { order_id } = req.params;

  // Assuming you have an array of items in the order containing book_id and quantity
  const orderItems = req.body.orderItems; // Adjust this based on how you send the data
    const insertPaymentQuery = `INSERT INTO PaymentMethods (payment_method, card_number, card_expiry_date, card_holder_name, cvc) 
                                VALUES (?, ?, ?, ?, ?)`;
    db.run(insertPaymentQuery, [paymentMethod, cardNumber, expiryDate, cardHolderName, cvv], function (err) {
      if (err) {
        console.error('Error inserting data into PaymentMethods table:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      const payment_id = this.lastID;

      // Update order status to 'Shipping' and associate payment_id
      const updateOrderQuery = `UPDATE Orders SET status = 'Shipping', payment_id = ? WHERE order_id = ?`;
      db.run(updateOrderQuery, [payment_id, order_id], function (err) {
        if (err) {
          db.rollback(() => {
            console.error('Error updating order status:', err);
            res.status(500).send('Internal Server Error');
          });
          return;
        }
        const orderItemQuery = `SELECT * from OrderItems WHERE order_id = ${order_id}`;
      db.all(orderItemQuery, function (err, orderItems) {
        if (err) {
          db.rollback(() => {
            console.error('Error updating order status:', err);
            res.status(500).send('Internal Server Error');
          });
          return;
        }
        orderItems.forEach((item) => {
          const { book_id, quantity } = item;
          const updateStockQuery = `UPDATE Books SET stock_quantity = stock_quantity - ? WHERE book_id = ?`;
          db.run(updateStockQuery, [quantity, book_id], function (err) {
            if (err) {
              db.rollback(() => {
                console.error('Error updating stock_quantity for book:', err);
                res.status(500).send('Internal Server Error');
              });
              return;
            }
          });
        });
          res.render('confirmation', { username: req.session.username });
      });
      });
    });
  });


//search
app.post('/search', (req, res) => {
  const { search } = req.body;
  var query;
  if(search == ""){
    query = `SELECT * FROM Books `;
  }else{
    query = `SELECT * FROM Books WHERE title LIKE '%${search}%' or author LIKE '%${search}%' or ISBN LIKE '%${search}%'`;
  }
  db.all(query,function(err, result) {
    if (err) {
      return res.status(500).send(err.message);
    }
    console.log(result)
    res.render('books', { 
      title: 'Search',
      books: result, 
      search: search,
      username: req.session.username,
      bestseller: null

      });
  });
});

//feedback
app.post('/feedback/:book_id', IsLoggedin, (req, res) => {
  const {rating, reviewText } = req.body;
  const {book_id} = req.params
  const user_id = req.session.user_id;
  const review_at = new Date().toISOString();
  db.run("INSERT INTO UserReviews (user_id, book_id, rating, review_text, review_date) VALUES (?, ?, ?, ?, ?)", [user_id, book_id, rating, reviewText, review_at], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.redirect(`/bookDetail/${book_id}`)
  });
});

app.use(express.static('public_html'));

app.listen(3000, function(){
  console.log("Web server running at: http://localhost:3000");
  console.log("Type Ctrl + C to shut dowm the web server");
});