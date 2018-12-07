const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');


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
                    password: "user1",
                  },
 "user2RandomID": {
                    id: "user2RandomID",
                    email: "user2@example.com",
                    password: "user2"
                  }
              }

// Database of URLs
const urlDatabase = {
          "b2xVn2": {
                      id: "userRandomID",
                      URL: "http://www.lighthouselabs.ca"
                    },
          "9sm5xK": {
                      id: "user2RandomID",
                      URL: "http://www.google.com"
                    }
                  };


// let longUrl = "";
// let shortUrl = "";
// for (let item in urlDatabase) {
//   longUrl = urlDatabase[item].URL;
//   shortUrl = item;
// }



//Home page
app.get("/", (req, res) => {
  res.send('<p> <b>Welcome to TinyApp!</b> <br> Register for free <a href="/register">here</a>! <br>Already a member! Login <a href="/login">here</a>!</p>');
});


// render the urls_new.ejs template to present the form to the user
app.get("/urls/new", (req, res) => {
  let templateVars = {  urls: urlDatabase,
                        currentUser: users[req.cookies['user_id']]
                      };
  res.render("urls_new", templateVars);
});


app.get("/urls", (req, res) => {
  if (!users[req.cookies['user_id']]) {
    res.redirect("/login");
    return;
  }
  const templateVars = { urls: urlDatabase,
                         currentUser: users[req.cookies['user_id']]
                        };
  res.render("urls_index", templateVars);
});

app.get('/urls_show', (req, res) => {
  const templateVars = { urls: urlDatabase,
                         longURL: longUrl,
                         currentUser: users[req.cookies['user_id']]
                        };
  res.render('urls_show', templateVars);
});


app.get('/register', (req, res) => {
    res.render('register');
});


app.get("/urls/:id", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  if (!currentUser) {
    res.send('You are not logged in. Please login <a href="/login">here</a> or register <a href="/register">here.</a>!</p>')
  } else if (currentUser.id !== urlDatabase[req.params.id].id) {
    res.send('This shortURL does not belong to you!')
  } else {

    let templateVars = {  urls: urlDatabase,
                          shortURL: req.params.id,
                          longURL: urlDatabase[req.params.id].URL,
                          currentUser: req.cookies["user_id"]
                        };
    res.render("urls_show", templateVars);
  }
});


// //create shortURL for longURL requested by user
// app.post("/urls", (req, res) => {
//   // let currentUser = users[req.cookies['user_id']];
//   // let newID = generateRandomString();
//   // if (currentUser === urlDatabase[newID]) {
//   //   urlDatabase['newID'] = {
//   //                           id: currentUser,
//   //                           URL: req.body.longURL
//   //                         }
//   // }
//   res.redirect(`/urls/${newID}`);
// });


app.get('/login', (req, res) => {
  let templateVars = {
                        currentUser: users[req.cookies['user_id']]
                      };
  res.render('login', templateVars);
});


// registration endpoint
app.post("/register", (req, res) => {
  let user_id = generateRandomUserID();
  //if user do not fill email/password. Send error message
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('<p>Email and/or Password cannot be blank!</p><a href="/register">Back to registration page.</a>');
  }
  //if user register with an email existed in users database. Send error message
  let existingUserEmail = [];
  for (let item in users) {
    existingUserEmail.push(users[item].email);
  }
  for (let i = 0; i < existingUserEmail.length; i++) {
    if (req.body.email === existingUserEmail[i]) {
    res.status(400).send('<p>Email already exist! Please <a href="/register">register</a> with another email or <a href="/login">Login here.</a>!</p>');
    }
  }
  //data entered in registration are added to users database
  users[user_id] = {
                        id: user_id,
                        email: req.body.email,
                        password: bcrypt.hashSync(req.body.password, 10)
                  }
  res.cookie('user_id', user_id); //setting cookie for newly registered user
  res.redirect("/urls");
})


  // function to find ID of current user
  function findUser(email) {
    for (const userId in users) {
      if (users[userId].email === email) {
        return users[userId].id;
      }
    }
    return false;
  }

  // function to authenticate user
  function authenticateUser(email, password) {
    // filter
    const [userId] = Object.keys(users).filter(
      id =>
        users[id].email === email && bcrypt.compareSync(password, users[id].password)
    );
    return userId;
  }


// login endpoint
app.post('/login', (req, res) => {
  // get the info from the form
  const { email, password } = req.body;

  // Authenticate the user
  const userId = authenticateUser(email, password);

  // if authenticate
  if (userId) {
    res.cookie('user_id', userId);
    // set the cookie -> store the id
    res.redirect('/urls');
  } else {
    res.status(403).send('<p>Email you are using is not registered! Please register <a href="/register">here</a> or login with another email <a href="/login"> here.</a>!</p>');
  }
})

//only registered/logged in user can create new URL
app.post('/urls/new', (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  if (!currentUser) {
    res.redirect("/login");
  }
  let newID = generateRandomString();
    urlDatabase[newID] = {
                            id: currentUser.id,
                            URL: req.body.newURL
                          }
  res.redirect('/urls');
});

//user input shortURL in browser and get redirect to the website of longURL
app.get("/u/:shortURL", (req, res) => {

  let longURL = urlDatabase[req.params.shortURL].URL;
  res.redirect(longURL);
});

app.post("/urls/:id", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  if (!currentUser) {
    res.redirect("/login");
  }
  res.redirect("/urls_index");
})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
})


//only registered user can delete existing URL
app.post("/urls/:id/delete", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  if (!currentUser) {
    res.redirect("/login");
  }
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
})

//only registered user can update existing URL
app.post("/urls/:id/update", (req, res) => {
  let currentUser = users[req.cookies['user_id']];
  if (!currentUser) {
    res.redirect("/login");
  }
  urlDatabase[req.params.id].URL = req.body.newLongURL;
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});














