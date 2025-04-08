require('dotenv').config(); // Ensures that .env variables are loaded before initialization

// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
app.use(express.static(__dirname + '/resources'));

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done();
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// *****************************************************
// <!-- Section 4 : Routes -->
// *****************************************************

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("pages/home", { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  try {
    const username = req.body.username;
    const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';
    const data = await db.one(query, [username]);

    const user = {
      username: data.username,
      password: data.password
    };

    const match = await bcrypt.compare(req.body.password, user.password);

    if (match) {
      req.session.user = user;
      req.session.save(() => {
        res.render("pages/home", { user: req.session.user });
      });
    } else {
      res.render('pages/login', {
        message: 'Incorrect username or password.',
        error: true
      });
    }
  } catch (err) {
    console.error(err);
    res.render('pages/login');
  }
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const username = req.body.username;

  const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *';
  const values = [username, hash];

  db.one(query, values)
    .then(user => {
      console.log('Inserted user:', user);
      res.redirect('/login');
    })
    .catch(error => {
      console.error('Error inserting user:', error);
      res.redirect('/register');
    });
});

app.get('/home', (req, res) => {
  res.render("pages/home", { user: req.session.user });
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("pages/profile", { user: req.session.user });
});

app.post('/profile/update', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { field, value, currentPassword } = req.body;
  const allowedFields = ['password'];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: "Invalid field" });
  }

  try {
    let updateQuery = '';
    let updateValues = [];

    if (field === 'password') {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password required." });
      }

      const userQuery = 'SELECT password FROM users WHERE username = $1';
      const userData = await db.one(userQuery, [req.session.user.username]);

      const isMatch = await bcrypt.compare(currentPassword, userData.password);
      if (!isMatch) {
        return res.status(403).json({ success: false, message: "Current password is incorrect." });
      }

      const hashed = await bcrypt.hash(value, 10);
      updateQuery = 'UPDATE users SET password = $1 WHERE username = $2';
      updateValues = [hashed, req.session.user.username];

    } else {
      updateQuery = `UPDATE users SET ${field} = $1 WHERE username = $2`;
      updateValues = [value, req.session.user.username];

      req.session.user[field] = value; // Keep session in sync
    }

    await db.none(updateQuery, updateValues);
    res.json({ success: true });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

app.get('/trips', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("pages/trips", { user: req.session.user });
});

app.get('/trips/new', (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  else{
    res.render('pages/trips_new', { user: req.session.user });
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    res.render('pages/logout');
  });
});

// *****************************************************
// <!-- Section 5 : Auth Middleware + Start Server -->
// *****************************************************

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.use(auth);
// app.listen(3000);//CHANGED FROM 5000 -> 3000
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');


app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});


