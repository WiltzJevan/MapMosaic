
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
const multer = require('multer');
const fs = require('fs');

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
app.use(express.static(__dirname + '/resources'));
app.use('/data', express.static(path.join(__dirname, 'resources/data')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
});

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

hbs.handlebars.registerHelper('formatDate', function (date, format) {
  return dayjs(date).format(format);
});

hbs.handlebars.registerHelper('timeAgo', function (date) {
  return dayjs(date).fromNow();
});

hbs.handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

const uploadDir = path.join(__dirname, "resources/images");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
  res.redirect("/home");
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  try {
    const username = req.body.username;
    const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';
    const data = await db.one(query, [username]);

    const match = await bcrypt.compare(req.body.password, data.password);

    if (match) {
      req.session.user = {
        id: data.id,
        username: data.username,
      };

      if (req.xhr) {
        return res.json({ success: true, redirect: '/home' });
      }

      return res.redirect('/home');
    } else {
      const errorMessage = 'Incorrect password. Please try again.';
      if (req.xhr) {
        return res.status(401).json({ error: errorMessage, errorType: 'wrong_password' });
      }

      return res.render('pages/login', { message: errorMessage });
    }
  } catch (err) {
    console.error(err);
    const errorMessage = 'User not found.';
    if (req.xhr) {
      return res.status(404).json({ error: errorMessage, errorType: 'user_not_found' });
    }

    res.render('pages/login', { message: errorMessage });
  }
});

const nodemailer = require('nodemailer');

// 📩 Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change to your email provider if needed
  auth: {
    user: process.env.CONTACT_EMAIL,       // Your email address
    pass: process.env.CONTACT_EMAIL_PASS   // Your app-specific password or email password
  }
});

// 📥 Show the contact form
app.get('/contact', (req, res) => {
  res.render('pages/contact');
});

// 📤 Handle form submissions and send email
app.post('/contact/submit', async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: process.env.CONTACT_EMAIL, // Receiver (you)
    subject: `New Contact Form Submission from ${name}`,
    text: `
📬 You’ve received a new message:

Name: ${name}
Email: ${email}

Message:
${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.render('pages/contact', {
      message: "✅ Thanks for reaching out! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("❌ Error sending contact email:", error);
    res.render('pages/contact', {
      message: "❌ Something went wrong while sending your message. Please try again later.",
    });
  }
});


app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userExists = await db.oneOrNone('SELECT id FROM users WHERE username = $1', [username]);

    if (userExists) {
      const error = { error: 'Username already exists.', errorType: 'user_exists' };
      return req.xhr
        ? res.status(409).json(error)
        : res.render('pages/register', { message: error.error });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await db.one(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, hash]
    );

    console.log('Inserted user:', newUser);

    return req.xhr
      ? res.json({ success: true, redirect: '/login?registered=1' })
      : res.redirect('/login?registered=1');

  } catch (error) {
    console.error('Error inserting user:', error);
    const message = 'Something went wrong. Please try again.';

    return req.xhr
      ? res.status(500).json({ error: message })
      : res.render('pages/register', { message });
  }
});

app.get("/home", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const trips = await db.any(
      `SELECT title, location, description, country_name, image_path
       FROM trips
       WHERE user_id = (SELECT id FROM users WHERE username = $1)`,
      [req.session.user.username]
    );

    res.render("pages/home", { user: req.session.user, trips });
  } catch (err) {
    console.error("Error loading trips for globe:", err);
    res.render("pages/home", { user: req.session.user, trips: [] });
  }
});

app.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const userId = req.session.user.id;

    const totalTrips = await db.one('SELECT COUNT(*) FROM trips WHERE user_id = $1', [userId]);
    const uniqueCountries = await db.one('SELECT COUNT(DISTINCT country_name) FROM trips WHERE user_id = $1', [userId]);
    const uniqueStates = await db.one('SELECT COUNT(DISTINCT location) FROM trips WHERE user_id = $1', [userId]);
    const recentTrip = await db.oneOrNone(
      `SELECT title, location, country_name, image_path, created_at 
       FROM trips 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`, 
      [userId]
    );

    res.render("pages/profile", {
      user: req.session.user,
      stats: {
        totalTrips: totalTrips.count,
        uniqueCountries: uniqueCountries.count,
        uniqueStates: uniqueStates.count
      },
      recentTrip
    });
  } catch (err) {
    console.error("Profile route error:", err);
    res.render("pages/profile", { user: req.session.user, stats: {}, recentTrip: null });
  }
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
      req.session.user[field] = value;
    }

    await db.none(updateQuery, updateValues);
    res.json({ success: true });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

app.get('/faq', (req, res) => {
  res.render('pages/faq', { user: req.session.user });
});

app.get('/trips', async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const trips = await db.any(
      `SELECT * FROM trips 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );

    console.log("Trips uploaded:", trips);
    res.render("pages/trips", { user: req.session.user, trips });
  } catch (err) {
    console.error("Error loading trips:", err);
    res.render("pages/trips", { user: req.session.user, trips: [] });
  }
});

// File Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./resources/images");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir); // Already created above
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + path.extname(file.originalname);
      cb(null, uniqueName);
    }
  })
});

app.get("/trips/new", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("pages/new", { user: req.session.user });
});

app.post("/trips/new", upload.single("image"), async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const { title, location, country_name, description, created_at} = req.body;
  const imagePath = req.file ? "/images/" + req.file.filename : null;
  const tripDate = created_at && created_at.trim() !== "" ? created_at : null;

  console.log("Trip submission received:");
  console.log("Title:", title);
  console.log("Location:", location);
  console.log("Country:", country_name);
  console.log("Image:", imagePath);
  console.log("Date:", tripDate);

  try {
    await db.none(
      `INSERT INTO trips (user_id, title, location, country_name, description, image_path, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.session.user.id, title, location, country_name, description, imagePath, tripDate]
    );

    res.redirect("/trips");
  } catch (err) {
    console.error("❌ Error saving trip:", err);
    res.status(500).send("Failed to create trip.");
  }
});

app.post('/trips/delete/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const tripId = req.params.id;

  try {
    await db.none(
      `DELETE FROM trips 
       WHERE id = $1 AND user_id = $2`,
      [tripId, req.session.user.id]
    );
    res.redirect('/trips');
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).send("Failed to delete trip.");
  }
});

app.post('/trips/edit/:id', async (req, res) => {
  const { title, location, description } = req.body;
  const tripId = req.params.id;

  try {
    await db.none(
      `UPDATE trips
       SET title = $1, location = $2, description = $3
       WHERE id = $4 AND user_id = $5`,
      [title, location, description, tripId, req.session.user.id]
    );
    res.redirect('/trips');
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).send('Failed to update trip.');
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

app.listen(3000);
console.log('Server is listening on port 3000');
