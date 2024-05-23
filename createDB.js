const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('projectDB.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

// Create the tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Books table
    db.run(`CREATE TABLE IF NOT EXISTS Books (
        book_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        genre TEXT,
        publication_date DATE,
        ISBN TEXT UNIQUE,
        price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        description TEXT,
        cover_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // ShoppingCart table
    db.run(`CREATE TABLE IF NOT EXISTS ShoppingCart (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    )`);

    // CartItems table
    db.run(`CREATE TABLE IF NOT EXISTS CartItems (
        cart_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        FOREIGN KEY (cart_id) REFERENCES ShoppingCart(cart_id),
        FOREIGN KEY (book_id) REFERENCES Books(book_id)
    )`);

    // PaymentMethods table
    db.run(`CREATE TABLE IF NOT EXISTS PaymentMethods (
        payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_method TEXT NOT NULL,
        card_number TEXT,
        card_expiry_date TEXT,
        card_holder_name TEXT,
        CVC TEXT
    )`);

    // ShippingAddresses table
    db.run(`CREATE TABLE IF NOT EXISTS ShippingAddresses (
        address_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        address_line1 TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        phone_number TEXT,
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS Orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_id INTEGER,
        shipping_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
        FOREIGN KEY (payment_id) REFERENCES PaymentMethods(payment_id),
        FOREIGN KEY (shipping_id) REFERENCES ShippingAddresses(address_id)
    )`);

    // OrderItems table
    db.run(`CREATE TABLE IF NOT EXISTS OrderItems (
        order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES Orders(order_id),
        FOREIGN KEY (book_id) REFERENCES Books(book_id)
    )`);

    // OrderHistory table
    db.run(`CREATE TABLE IF NOT EXISTS OrderHistory (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        status_change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES Orders(order_id)
    )`);

    // UserReviews table
    db.run(`CREATE TABLE IF NOT EXISTS UserReviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT,
        review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
        FOREIGN KEY (book_id) REFERENCES Books(book_id)
    )`);

    // Bestsellers table
    db.run(`CREATE TABLE IF NOT EXISTS Bestsellers (
        bestseller_id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES Books(book_id)
    )`);
});

const books = [
  {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      publisher: "J.B. Lippincott & Co.",
      genre: "Fiction",
      publication_date: "1960-07-11",
      ISBN: "9780061120084",
      price: 10.99,
      stock_quantity: 50,
      description: "A novel about the serious issues of rape and racial inequality.",
      cover_image_url: "images/cover1.jpg"
  },
  {
      title: "1984",
      author: "George Orwell",
      publisher: "Secker & Warburg",
      genre: "Dystopian",
      publication_date: "1949-06-08",
      ISBN: "9780451524935",
      price: 8.99,
      stock_quantity: 40,
      description: "A novel that presents a dystopian future under a totalitarian regime.",
      cover_image_url: "images/cover2.jpg"
  },
  {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      publisher: "T. Egerton",
      genre: "Romance",
      publication_date: "1813-01-28",
      ISBN: "9780141040349",
      price: 7.99,
      stock_quantity: 30,
      description: "A classic novel about love and societal expectations.",
      cover_image_url: "images/cover3.jpg"
  },
  {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      publisher: "Charles Scribner's Sons",
      genre: "Fiction",
      publication_date: "1925-04-10",
      ISBN: "9780743273565",
      price: 9.99,
      stock_quantity: 20,
      description: "A novel about the American dream and the Roaring Twenties.",
      cover_image_url: "images/cover4.jpg"
  },
  {
      title: "Moby-Dick",
      author: "Herman Melville",
      publisher: "Harper & Brothers",
      genre: "Adventure",
      publication_date: "1851-10-18",
      ISBN: "9780142437247",
      price: 11.99,
      stock_quantity: 15,
      description: "A novel about the quest to capture a giant white whale.",
      cover_image_url: "images/cover5.jpg"
  },
  {
      title: "War and Peace",
      author: "Leo Tolstoy",
      publisher: "The Russian Messenger",
      genre: "Historical",
      publication_date: "1869-01-01",
      ISBN: "9780199232765",
      price: 12.99,
      stock_quantity: 25,
      description: "A novel that chronicles the French invasion of Russia.",
      cover_image_url: "images/cover6.jpg"
  },
  {
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      publisher: "Little, Brown and Company",
      genre: "Fiction",
      publication_date: "1951-07-16",
      ISBN: "9780316769488",
      price: 8.99,
      stock_quantity: 30,
      description: "A novel about teenage rebellion and alienation.",
      cover_image_url: "images/cover7.jpg"
  },
  {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      publisher: "George Allen & Unwin",
      genre: "Fantasy",
      publication_date: "1937-09-21",
      ISBN: "9780547928227",
      price: 10.99,
      stock_quantity: 40,
      description: "A fantasy novel about the adventures of Bilbo Baggins.",
      cover_image_url: "images/cover8.jpg"
  },
  {
      title: "Brave New World",
      author: "Aldous Huxley",
      publisher: "Chatto & Windus",
      genre: "Dystopian",
      publication_date: "1932-08-30",
      ISBN: "9780060850524",
      price: 9.99,
      stock_quantity: 35,
      description: "A novel that presents a futuristic society driven by technology and conditioning.",
      cover_image_url: "images/cover9.jpg"
  },
  {
      title: "The Lord of the Rings",
      author: "J.R.R. Tolkien",
      publisher: "George Allen & Unwin",
      genre: "Fantasy",
      publication_date: "1954-07-29",
      ISBN: "9780544003415",
      price: 29.99,
      stock_quantity: 20,
      description: "An epic fantasy trilogy about the struggle to destroy the One Ring.",
      cover_image_url: "images/cover10.jpg"
  },
  {
      title: "Crime and Punishment",
      author: "Fyodor Dostoevsky",
      publisher: "The Russian Messenger",
      genre: "Psychological Fiction",
      publication_date: "1866-01-01",
      ISBN: "9780140449136",
      price: 11.99,
      stock_quantity: 20,
      description: "A novel about the mental anguish of a man who commits a murder.",
      cover_image_url: "images/cover11.jpg"
  },
  {
      title: "The Brothers Karamazov",
      author: "Fyodor Dostoevsky",
      publisher: "The Russian Messenger",
      genre: "Philosophical Novel",
      publication_date: "1880-01-01",
      ISBN: "9780374528379",
      price: 13.99,
      stock_quantity: 15,
      description: "A novel about the lives and moral struggles of three brothers.",
      cover_image_url: "images/cover12.jpg"
  },
  {
      title: "Great Expectations",
      author: "Charles Dickens",
      publisher: "Chapman & Hall",
      genre: "Fiction",
      publication_date: "1861-08-01",
      ISBN: "9780141439563",
      price: 8.99,
      stock_quantity: 25,
      description: "A novel about the growth and personal development of an orphan named Pip.",
      cover_image_url: "images/cover13.jpg"
  },
  {
      title: "Jane Eyre",
      author: "Charlotte Brontë",
      publisher: "Smith, Elder & Co.",
      genre: "Romance",
      publication_date: "1847-10-16",
      ISBN: "9780142437209",
      price: 9.99,
      stock_quantity: 30,
      description: "A novel about the experiences of the orphan Jane Eyre.",
      cover_image_url: "images/cover14.jpg"
  },
  {
      title: "The Picture of Dorian Gray",
      author: "Oscar Wilde",
      publisher: "Lippincott's Monthly Magazine",
      genre: "Philosophical Fiction",
      publication_date: "1890-06-20",
      ISBN: "9780141442464",
      price: 7.99,
      stock_quantity: 35,
      description: "A novel about a man who remains young while his portrait ages.",
      cover_image_url: "images/cover15.jpg"
  }
];

const bestsellers = [
  {
      book_id: 1,
  },
  {
      book_id: 2,
  },
  {
      book_id: 3,
  },
  {
      book_id: 4,
  },
  {
      book_id: 5,
  }
];

// Insert books into the Books table
db.serialize(() => {
  const stmt = db.prepare(`INSERT INTO Books (
      title, author, publisher, genre, publication_date, ISBN, price, stock_quantity, description, cover_image_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  books.forEach((book) => {
      stmt.run(
          book.title,
          book.author,
          book.publisher,
          book.genre,
          book.publication_date,
          book.ISBN,
          book.price,
          book.stock_quantity,
          book.description,
          book.cover_image_url
      );
  });

  stmt.finalize();
});

db.serialize(() => {
  const stmt = db.prepare(`INSERT INTO Bestsellers (book_id) VALUES (?)`);

  bestsellers.forEach((bestseller) => {
      stmt.run(bestseller.book_id);
  });

  stmt.finalize();
});


db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Close the database connection.');
});
