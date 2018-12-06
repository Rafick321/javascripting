var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080

// body-parser library will allow us to access POST request parameters, such as req.body.longURL
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// tells Express app to use EJS as its templating engine
app.set("view engine", "ejs");


// Function to generate a random User ID
function generateRandomUserID() {
  let randomString = "";
  const possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i <= 5; i++) {
    randomString += possible[(Math.floor(Math.random() * possible.length))];
  }
  return `USER${randomString}`;
}

// Function to generate a string of 6 random alphanumeric shortURL
function generateRandomString() {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i <= 5; i++) {
    randomString += possible[(Math.floor(Math.random() * possible.length))];
  }
  return randomString;
}


// Database of Users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "user1"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "user2"
  }
}

// Database of shortURL and longURL
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// render the urls_new.ejs template to present the form to the user
app.get("/urls/new", (req, res) => {
  let templateVars = {
                        currentUser: req.cookies["username"]
                      };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  res.render("/login");
});

//Home page
app.get("/", (req, res) => {
  res.send("Welcome to TinyApp!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       currentUser: req.cookies["username"]
                     };
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {
  let currentUser = req.body.username
  res.cookie('username', currentUser);
  res.redirect('/urls');
})


//create shortURL for longURL requested by user
app.post("/urls", (req, res) => {
  var newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`/urls/${newID}`);
});

app.get('/urls_show', function(req, res) {
    res.render('urls_show');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// registration endpoint
app.post("/register", (req, res) => {
  let newUser = generateRandomUserID();
  //if user do not fill email/password. Send error message
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('Email and/or Password cannot be blank!');
  }
  //if user register with an email existed in users database. Send error message
  let existingUserEmail = [];
  for (let item in users) {
    existingUserEmail.push(users[item].email);
  }
  for (let i = 0; i < existingUserEmail.length; i++) {
    if (req.body.email === existingUserEmail[i]) {
    res.status(400).send('Email already exist. Please user another email or login!');
    }
  }
  //data entered in registration are added to users database
  users[newUser] = {
                        id: newUser,
                        email: req.body.email,
                        password: req.body.password
                      }
  res.cookie('user_id', newUser); //setting cookie for newly registered user

  res.redirect("/urls");
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {
                        shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id],
                        currentUser: req.cookies["username"]
                      };

  res.render("urls_show", templateVars);
});

//user input shortURL in browser and redirect to the website of longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
})

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});














