const express = require('express')
const app = express()
const dotenv = require('dotenv');
const path = require('path');
const { ppid } = require('process');
const {pool} = require("./dbConfig");
const bcrypt = require('bcrypt');



dotenv.config();
const port = process.env.PORT 

// app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
// app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))

// let intialPath = path.join(__dirname, "public");

// app.use(express.json());
// app.use(express.static(intialPath));



// app.get('/login', (req, res) => {
//   res.sendFile(path.join(intialPath, "login.html"));
// })

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));

app.get('/', (req,res) => {
  res.render("index")
});

app.get('/users/register', (req, res) =>{
  res.render("register")
});

app.get('/users/login', (req, res) =>{
  res.render("login")
});

app.get('/users/dashboard', (req, res) =>{
  res.render("dashboard", {user: "Zev"})
});

app.post('/users/register', async (req,res) =>{
  let { name, email, password, password2 } =req.body;
  console.log({name,
    email,
    password,
    password2});

    let errors = [];

    if(!name || !email || !password || !password2){
      errors.push({message: "Please enter all fields"})
    }

    if(password.length < 6){
      errors.push({ message: "Password should be at least 6 charachters" });

    }

    if(password != password2){
      errors.push({message: "Passwords do not match!" });
    }

    if(errors.length > 0){
      res.render("register", { errors });
    }else{
      //form validation has passed

      let hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);

      pool.query(
        `SELECT * FROM users
        WHERE email = $1`,
         [email], 
         (err, results) =>{
          if (err) {
            throw err;
          }
          console.log(results.rows);

          if(results.rows.length > 0){
            errors.push({message: "Email is already registered"});
            res.render('register', {errors})
          }

         }

      )
    }



})

app.listen(port ||8080, () => {
  console.log(`Running on port ${port ||8080}`);
})