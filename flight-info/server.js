const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const app = express();
const dotenv = require('dotenv');
const path = require('path')
const cors = require('cors')
const bodyParser = require('body-parser');
const request = require('request');


dotenv.config();
const port = process.env.PORT
const apiKey = process.env.API_KEY
app.use(cors())

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware

// app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/users/login", checkAuthenticated, (req, res) => {

  res.render("login.ejs");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("dashboard", { user: req.user.name });
});


app.get("/users/logout", function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash("succes_msg", "Logged out succesfully.");
    res.redirect("login");
  });
});


app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING user_id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/weather",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);


app.get('/users/weather', checkNotAuthenticated,(req, res)=> {
  res.render('weather.ejs', { weather: null, error: null});
  // res.render('weather.ejs', {user: req.user.name})
})

app.post('/users/weather', function (req, res) {
  console.log(req.body.city);
  let city = req.body.city;
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`

  request(url, function (err, response, body) {
    if(err){
      res.render('weather.ejs', {weather: null, error: 'Error, please try again'});
    } else {
      let weather = JSON.parse(body)
      if(weather.main == undefined){
        res.render('weather.ejs', {weather: null, error: 'Error, please try again'});
      } else {
        let weatherText = `It's ${weather.main.temp}  degrees in ${weather.name}!`;
        let weatherTextExpanded = `It's ${weather.main.temp} degrees, with
          ${weather.main.humidity}% humidity in ${weather.name}!`;
        res.render('weather.ejs', { weather: weatherTextExpanded, error: null});
      //  res.render('weather.ejs', { user: req.user.name }) ;
      }
    }
  });
})




function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/weather");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}


app.listen(port ||8080, () => {
  console.log(`Running on port ${port ||8080}`);
})

