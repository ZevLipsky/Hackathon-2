const express = require('express')
const app = express()
const dotenv = require('dotenv');
const path = require('path');


dotenv.config();
let port = process.env.PORT

let intialPath = path.join(__dirname, "public");

app.use(express.json());
app.use(express.static(intialPath));



app.get('/login', (req, res) => {
  res.sendFile(path.join(intialPath, "login.html"));
})

app.listen(port ||8080, () => {
  console.log(`Running on port ${port ||8080}`);
})