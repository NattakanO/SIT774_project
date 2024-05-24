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
        type TEXT DEFAULT 'customer',
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
        subGenre TEXT,
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
        payment_id INTEGER NULL,
        shipping_id INTEGER NULL,
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

    db.run(`INSERT INTO Users (username, password_hash, email, first_name, last_name, phone_number, type)
    VALUES ('admin', '$2a$10$3snEfgGIYtXdF3sUOBGUdOqaWuxTlpEMUMmx81c.88kDGZ18LyBzW', 'admin@example.com', 'Admin', 'User', '1234567890', 'admin')`,);

});
const books = [
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      publisher: "J.B. Lippincott & Co.",
      genre: "Fiction",
      subGenre: "Classic",
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
      genre: "Fiction",
      subGenre: "Dystopian",
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
      genre: "Fiction",
      subGenre: "Romance",
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
      subGenre: "Classic",
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
      genre: "Fiction",
      subGenre: "Adventure",
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
      genre: "Fiction",
      subGenre: "Historical",
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
      subGenre: "Coming-of-Age",
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
      genre: "Fiction",
      subGenre: "Fantasy",
      publication_date: "1937-09-21",
      ISBN: "9780547928227",
      price: 10.99,
      stock_quantity: 40,
      description: "A fantasy novel about the adventures of Bilbo Baggins.",
      cover_image_url: "images/cover8.jpg"
    },
    {
      title: "The Diary of a Young Girl",
      author: "Anne Frank",
      publisher: "Contact Publishing",
      genre: "Non-Fiction",
      subGenre: "Autobiography",
      publication_date: "1947-06-25",
      ISBN: "9780385480338",
      price: 12.99,
      stock_quantity: 30,
      description: "The personal diary of Anne Frank, a Jewish girl hiding from the Nazis during World War II.",
      cover_image_url: "images/anne_frank_diary.jpg"
    },
    {
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      publisher: "Harper",
      genre: "Non-Fiction",
      subGenre: "Anthropology",
      publication_date: "2014-02-10",
      ISBN: "9780062316097",
      price: 15.99,
      stock_quantity: 25,
      description: "An exploration of the history of humankind from the emergence of Homo sapiens to the present day.",
      cover_image_url: "images/sapiens.jpg"
    },
    {
      title: "Educated",
      author: "Tara Westover",
      publisher: "Random House",
      genre: "Non-Fiction",
      subGenre: "Memoir",
      publication_date: "2018-02-20",
      ISBN: "9780399590504",
      price: 14.99,
      stock_quantity: 30,
      description: "A memoir about the author's journey from growing up in a strict survivalist family to earning a PhD from Cambridge University.",
      cover_image_url: "images/educated.jpg"
    },
    {
      title: "Goodnight Moon",
      author: "Margaret Wise Brown",
      publisher: "Harper & Brothers",
      genre: "Kids",
      subGenre: "Bedtime Story",
      publication_date: "1947-09-03",
      ISBN: "9780060775858",
      price: 6.99,
      stock_quantity: 40,
      description: "A classic children's bedtime book featuring a bunny saying goodnight to everything around.",
      cover_image_url: "images/goodnight_moon.jpg"
    },
    {
      title: "Harry Potter and the Chamber of Secrets",
      author: "J.K. Rowling",
      publisher: "Bloomsbury",
      genre: "Kids",
      subGenre: "Fantasy",
      publication_date: "1998-07-02",
      ISBN: "9780747538493",
      price: 10.99,
      stock_quantity: 35,
      description: "The second book in the Harry Potter series, following Harry's second year at Hogwarts School of Witchcraft and Wizardry.",
      cover_image_url: "images/harry_potter_chamber_of_secrets.jpg"
    },
    {
      title: "The Elements of Style",
      author: "William Strunk Jr.",
      publisher: "Harper & Brothers",
      genre: "Textbook",
      subGenre: "Writing Style",
      publication_date: "1918-07-01",
      ISBN: "9780205309023",
      price: 8.99,
      stock_quantity: 25,
      description: "A classic guide to English usage and style.",
      cover_image_url: "images/elements_of_style.jpg"
    },
    {
      title: "The Very Hungry Caterpillar",
      author: "Eric Carle",
      publisher: "World Publishing Company",
      genre: "Kids",
      subGenre: "Picture Book",
      publication_date: "1969-06-03",
      ISBN: "9780399226908",
      price: 5.99,
      stock_quantity: 45,
      description: "A children's picture book about a caterpillar's journey to become a butterfly.",
      cover_image_url: "images/very_hungry_caterpillar.jpg"
    },
    
    {
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      publisher: "Scholastic",
      genre: "Kids",
      subGenre: "Fantasy",
      publication_date: "1997-06-26",
      ISBN: "9780590353427",
      price: 9.99,
      stock_quantity: 50,
      description: "The first book in the Harry Potter series, following the adventures of a young wizard.",
      cover_image_url: "images/harry_potter_sorcerers_stone.jpg"
    },
    {
      title: "Matilda",
      author: "Roald Dahl",
      publisher: "Jonathan Cape",
      genre: "Kids",
      subGenre: "Fantasy",
      publication_date: "1988-10-01",
      ISBN: "9780142410370",
      price: 7.99,
      stock_quantity: 40,
      description: "A children's novel about a young girl with telekinetic abilities who loves to read.",
      cover_image_url: "images/matilda.jpg"
    },
    {
      title: "Campbell Biology",
      author: "Jane B. Reece",
      publisher: "Pearson",
      genre: "Textbook",
      subGenre: "Biology",
      publication_date: "1987-06-01",
      ISBN: "9780134093413",
      price: 99.99,
      stock_quantity: 20,
      description: "A comprehensive textbook covering various aspects of biology.",
      cover_image_url: "images/campbell_biology.jpg"
    },     
    {
      title: "Brave New World",
      author: "Aldous Huxley",
      publisher: "Chatto & Windus",
      genre: "Fiction",
      subGenre: "Dystopian",
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
      genre: "Fiction",
      subGenre: "Fantasy",
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
      genre: "Fiction",
      subGenre: "Psychological Fiction",
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
      genre: "Fiction",
      subGenre: "Philosophical Novel",
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
      subGenre: "Classic",
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
      genre: "Fiction",
      subGenre: "Romance",
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
      genre: "Fiction",
      subGenre: "Philosophical Fiction",
      publication_date: "1890-06-20",
      ISBN: "9780141442464",
      price: 7.99,
      stock_quantity: 35,
      description: "A novel about a man who remains young while his portrait ages.",
      cover_image_url: "images/cover15.jpg"
    },
];

const bestsellers = [
  {
      book_id: 8,
  },
  {
      book_id: 6,
  },
  {
      book_id: 10,
  },
  {
      book_id: 16,
  },
  {
      book_id: 5,
  }
];

// Insert books into the Books table
db.serialize(() => {
  const stmt = db.prepare(`INSERT INTO Books (
      title, author, publisher, genre, subGenre, publication_date, ISBN, price, stock_quantity, description, cover_image_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  books.forEach((book) => {
      stmt.run(
          book.title,
          book.author,
          book.publisher,
          book.genre,
          book.subGenre,
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
