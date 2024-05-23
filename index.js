const express = require("express");
const morgan = require('morgan');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('myDB');
var app = express();

app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }));
app.use(morgan('common'));

app.get('/index.js', function(req, res) {
  res.sendFile(__dirname + '/index.js');
});
app.get('/', (req, res, next) => {
  res.render('index', { title: 'Ice Cream Review' }); 
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