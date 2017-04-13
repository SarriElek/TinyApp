const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

let urlDatabase = [
  {
    shortURL : 'b2xVn2',
    url: 'http://www.lighthouselabs.ca',
    userId: 1
  },
  {
    shortURL: '9sm5xK',
    url: 'http://www.google.com',
    userId: 1
  }
];

const users = [
{
  id: 1,
  username: 'Edurne',
  password: '$2a$10$4hCD2RRuTLQmUKu3MTgZne.WjOsVcLg8m0Nqp1IAx2KADKxiyh3ye', //polarbear
  email: 'edurne.berastegi@gmail.com'
},
{
  id: 2,
  username: 'Javier',
  password: '$2a$10$OF0ovt9MLprffDHmBTFpIOGN4uwjUiTvo3CGM434kIs5KoaDxB07i', //grizzlybear
  email: 'javier@gmail.com'
}
];

let lastId = 2;


// CONFIGURATION
app.set('view engine', 'ejs');
// MIDDLEWARES
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['lighthouse'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// MIDDLEWARE
// check if the user is logged in
 app.use(function(req, res, next) {
   req.user = null; //initialize with null value
   if (req.session.id) {
     req.user = users.find(user => user.id === req.session.id);
   }
   next();
 });


// INDEX
app.get('/', (req, res) => {
  if(req.user){
    res.redirect('urls');
  }else{
    res.redirect('login');
  }
});

// LOGIN
app.get('/login', (req, res) => {
  if(req.user){
    res.redirect('/');
  }else{
    const templateVars = {
      user: req.user,
      errorMessage: ''
    };
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  var user = users.find(user =>  user.email === email);
  if(!user){
    const templateVars = {
      user: null,
      errorMessage: 'Email not found'
    };
    res.status(403);
    res.render('login', templateVars);
  }else if(bcrypt.compareSync(password, user.password)){
    req.session.id = user.id;
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
  req.session = null;
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
      const hashed_password = bcrypt.hashSync(password, 10);
      const user = {
        id,
        email,
        username,
        password : hashed_password
      };
      users.push(user);
      req.session.id = user.id;
      res.redirect('/');
    }

});

// READ URLS
app.get('/urls', (req, res) => {
  if(req.user){
    const templateVars = {
      user: req.user,
      userURLs: getUserURLs(req.user.id)
    };
    res.render('urls_index', templateVars);
  }else{
    const templateVars = {
       user: req.user,
       errorMessage: 'You must be logged in to see your shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }

});

// CREATE NEW URL
app.post('/urls', (req, res) => {
  if(req.user){
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    if(shortURL && longURL){
      const newURL = {
        shortURL,
        url: longURL,
        userId: req.user.id
      };
      urlDatabase.push(newURL);
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

// CREATE NEW URL FORM
app.get('/urls/new', (req, res) => {
  if(req.user){
    const templateVars = {
      user : req.user
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

// UPDATE URL FORM
app.get('/urls/:id', (req, res) => {
  if(req.user){
    const templateVars = {
      user : req.user,
      shortURL: req.params.id,
      longURL: findURL(req.params.id).url
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

// UPDATE URL
app.post('/urls/:id', (req, res) => {
  if(req.user){
    const shortURL = req.params.id;
    const longURL = req.body.longURL;
    const usersURL = isUsersURL(shortURL, req);
    if(usersURL){
      if(longURL){
        urlInfo = findURL(shortURL);
        urlInfo.url = longURL;
      }
      res.redirect('/urls');
    }else{
      const templateVars = {
        errorMessage: 'You cannot update another users shortened URLs',
        showLogin: false
      };
      res.status(403).render('error', templateVars);
    }
  }else{
    const templateVars = {
       errorMessage: 'You must be logged in to update a shortened URLs',
       showLogin: true
    };
    res.status(401).render('error', templateVars);
  }
});

// DELETE URL
app.post('/urls/:id/delete', (req, res) => {
  if(req.user){
    const shortURL = req.params.id;
    const usersURL = isUsersURL(shortURL, req);
    if(usersURL){
      urlDatabase = urlDatabase.filter(item => item.shortURL !== shortURL);
      res.redirect('/urls');
    }else{
      const templateVars = {
       errorMessage: 'You cannot delete another users shortened URLs',
       showLogin: false
      };
      res.status(403).render('error', templateVars);
    }

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
  const longURL = findURL(req.params.shortURL).url;
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


// HELPER FUNCTIONS

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

function getUserURLs(userId){
  return urlDatabase.filter(url => url.userId === Number(userId));
}

function isUsersURL(shortURL, req){
  const urlInfo = urlDatabase.find(url => url.userId === Number(req.session.id));
  return urlInfo?true:false;
}

function findURL(shortURL){
  const urlInfo = urlDatabase.find(url => url.shortURL === shortURL);
  return urlInfo;
}