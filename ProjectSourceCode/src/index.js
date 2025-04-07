require('dotenv').config(); //Ensures that .env variables are loaded before initalization

// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
app.use(express.static(__dirname + '/resources'));
// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.


// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here
// app.get('/', (req, res) => {
//     res.render('pages/home');
//   });

app.get("/", (req, res) => {
  if (!req.session.user) {
    res.redirect("/login"); // Redirect to login if not logged in
  }
  else{
    res.render("pages/home", { user: req.session.user }); // Pass user data
  }
});
  
app.get('/login', (req, res) => {
    res.render('pages/login');
});


app.post('/login', async (req, res) => {
    try {
        const username = req.body.username;
        const query = 'SELECT * FROM users WHERE users.username = $1 LIMIT 1';
        const values = [username];

        // Fetch user data from the database
        const data = await db.one(query, values);

        // Create a user object
        const user = {
            username: username,
            password: data.password
        };

        // check if password from request matches with password in DB
        const match = await bcrypt.compare(req.body.password, user.password);

        if (match) {
            req.session.user = user;
            req.session.save(() => {
                // res.redirect('/home');
                res.render("pages/home", { user: req.session.user }); // Pass user data
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

app.get('/home', (req, res) => {
  res.render("pages/home", { user: req.session.user }); // Pass user data
});

app.post('/profile/update', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { field, value } = req.body;
  const allowedFields = ['username', 'email', 'password'];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: "Invalid field" });
  }

  try {
    let updateQuery = '';
    let updateValues = [];

    if (field === 'password') {
      const hashed = await bcrypt.hash(value, 10);
      updateQuery = 'UPDATE users SET password = $1 WHERE username = $2';
      updateValues = [hashed, req.session.user.username];
    } else {
      updateQuery = `UPDATE users SET ${field} = $1 WHERE username = $2`;
      updateValues = [value, req.session.user.username];

      // Optional: update session value for username/email if changed
      req.session.user[field] = value;
    }

    await db.none(updateQuery, updateValues);
    res.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    res.redirect("/login"); // Redirect to login if not logged in
  }
  else{
    res.render("pages/profile", { user: req.session.user }); // Pass user data
  }
});

app.get('/trips', (req, res) => {
  if (!req.session.user) {
    res.redirect("/login"); // Redirect to login if not logged in
  }
  else{
    res.render("pages/trips", { user: req.session.user }); // Pass user data
  }
});

app.post('/register', async (req, res) => {
    //hash the password using bcrypt library
    const hash = await bcrypt.hash(req.body.password, 10);

    // To-DO: Insert username and hashed password into the 'users' table
    const username = req.body.username;
    const values = [username, hash];
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *'
    db.one(query, values)
        //.then(user => console.log('Inserted user:', user))
        .then(user => {
            console.log('Inserted user:', user);
            res.redirect('/login');
        })
        //.catch(error => console.error('Error inserting user:', error));
        .catch(error => {
            console.error('Error inserting user:', error);
            res.redirect('/register'); // Redirect on failure
        });
});



// Authentication Middleware.
const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to login page.
      return res.redirect('/login');
    }
    next();
  };
  
  // Authentication Required
  app.use(auth);


  app.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
      res.render('pages/logout'); // ✅ layout will be used (main.hbs)
    });
  });

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');