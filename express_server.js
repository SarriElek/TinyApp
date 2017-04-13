const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = [
{
  id: 1,
  username: 'Edurne',
  password: 'polarbear',
  email: 'edurne.berastegi@gmail.com'
},
{
  id: 2,
  username: 'Javier',
  password: 'grizlybear',
  email: 'javier@gmail.com'
}
];

let lastId = 2;


// CONFIGURATION
app.set('view engine', 'ejs');
// MIDDLEWARES
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// INDEX
app.get('/', (req, res) => {
  const user = users.find(user => user.id === Number(req.cookies.id));
  if(user){
    res.redirect('urls');
  }else{
    res.redirect('login');
  }
});

// LOGIN
app.get('/login', (req, res) => {
  const user = users.find(user => user.id === Number(req.cookies.id));
  if(user){
    res.redirect('/');
  }else{
    const templateVars = {
      user,
      errorMessage: ''
    };
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  var user = users.find(user =>  user.email === email);
  console.log(user);
  if(!user){
    const templateVars = {
      user: null,
      errorMessage: 'Email not found'
    };
    res.status(403);
    res.render('login', templateVars);
  }else if(password === user.password){
    res.cookie('id', user.id);
    res.redirect('/');
  }else{
    const templateVars = {
      user: null,
      errorMessage: 'Wrong password'
    };
    res.status(403);
    res.render('login', templateVars);
  }
});

// LOGOUT
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/');
});

// REGISTRATION
app.get('/register', (req, res) => {
  const templateVars = {
    user : null,
    errorMessage: ''
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const userWithSameEmail = users.find(user =>  user.email === email);
    if(userWithSameEmail){
      const templateVars = {
       user: null,
       errorMessage: 'There is an existing user with that email'
      };
      res.status(400);
      res.render('register', templateVars);
    }else if(!email || !password){
      const templateVars = {
       user: null,
       errorMessage: 'Email and Password cannot be blanck'
      };
      res.status(400);
      res.render('register', templateVars);
    }else{
      const id = generateId();
      const user = {
        id,
        email,
        password,
        username
      };
      users.push(user);
      res.cookie('id', id);
      res.redirect('/');
    }

});

// URLS GET ROUTE HANDLER
app.get('/urls', (req, res) => {
  const user = users.find(user => user.id === Number(req.cookies.id));
  if(user){
    const templateVars = {
      user,
      urls: urlDatabase
    };
    res.render('urls_index', templateVars);
  }else{
    const templateVars = {
       user,
       errorMessage: 'You must be logged in to see your shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }

});

// URLS POST ROUTE HANDLER
app.post('/urls', (req, res) => {
  if(req.cookies['username']){
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    if(shortURL && longURL){
      urlDatabase[shortURL] = longURL;
    }
    res.redirect(`/urls/${shortURL}`);
  }else{
    const templateVars = {
       errorMessage: 'You must be logged in to create new shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }

});

// URL TO CREATE NEW URL
app.get('/urls/new', (req, res) => {
  if(req.cookies['username']){
    const templateVars = {
      username: req.cookies["username"]
    }
    res.render('urls_new', templateVars);
  }else{
    const templateVars = {
       errorMessage: 'You must be logged in to create new shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }
});

// URL WITH ID ROUTE HANDLER
app.get('/urls/:id', (req, res) => {
  if(req.cookies['username']){
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id],
      username: req.cookies["username"]
    };
    if(templateVars.longURL){
      res.render('urls_show', templateVars);
    }else{
      res.redirect('/urls');
    }
  }else{
    const templateVars = {
       errorMessage: 'You must be logged in to update a shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }
});

// URL WITH ID TO UPDATE ROUTE HANDLER
app.post('/urls/:id', (req, res) => {
  if(req.cookies['username']){
    const shortURL = req.params.id;
    const longURL = req.body.longURL;
    if(longURL){
      urlDatabase[shortURL] = longURL;
    }
    res.redirect('/urls');
  }else{
    const templateVars = {
       errorMessage: 'You must be logged in to update a shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }
});

// URL WITH ID TO DELETE ROUTE HANDLER
app.post('/urls/:id/delete', (req, res) => {
  if(req.cookies['username']){
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL];
    if(longURL){
      delete urlDatabase[shortURL];
    }
    res.redirect('/urls');
  }else{
    const templateVars = {
       errorMessage: 'You must be logged in to delete a shortened URLs',
       showLogin: false
    };
    res.status(404).render('error', templateVars);
  }
});

// URL TO REDIRECT SHORT URL TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if(longURL){
    res.redirect(longURL);
  }else{
     const templateVars = {
       errorMessage: `The URL with id: ${req.params.shortURL} Not Found`,
       showLogin: false
     };
     res.status(404).render('error', templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString(){
  let randomString = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 6; i > 0; --i) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
}

function generateId(){
  lastId ++
  return lastId;
}