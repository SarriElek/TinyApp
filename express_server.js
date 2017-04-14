const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
var methodOverride = require('method-override');

let urlDatabase = [
  {
    shortURL : 'b2xVn2',
    url: 'http://www.lighthouselabs.ca',
    userId: 1,
    visits: [],
    visitors: []
  },
  {
    shortURL: '9sm5xK',
    url: 'http://www.google.com',
    userId: 1,
    visits:  [
      {created: formatDate(new Date()), visitorId: 1},
      {created: formatDate(new Date()), visitorId: 2}
    ],
    visitors: [ 1, 2 ]
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
app.use(methodOverride('_method'))


// MIDDLEWARE
// check if the user is logged in
 app.use(function(req, res, next) {
   req.user = null; //initialize with null value
   if (req.session.id) {
     req.user = users.find(user => user.id === req.session.id);
   }else{
    if(!req.session.anonymousUser){
      req.session.anonymousUser = generateRandomString();
    }
   }
   next();
 });

 // centralize errors
 app.use(function(req, res, next){
    res.sendError = function(message, showLogin, code){
      const templateVars = {
       user: req.user,
       errorMessage: message,
       showLogin: showLogin
      };
      res.status(code).render('error', templateVars);
    };
    next();
 });


// INDEX
app.get('/', (req, res, next) => {
   if(req.user){
     res.redirect('urls');
   }else{
    res.redirect('login');
   }
});

// LOGIN
app.get('/login', (req, res, next) => {
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
    res.sendError('You must be logged in to see your shortened URLs', true, 401);
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
        userId: req.user.id,
        visits: [],
        visitors: []
      };
      urlDatabase.push(newURL);
    }
    res.redirect(`/urls/${shortURL}`);
  }else{
    res.sendError('You must be logged in to create new shortened URLs', true, 401);
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
    res.sendError('You must be logged in to create new shortened URLs', true, 401);
  }
});

// UPDATE URL FORM
app.get('/urls/:id', (req, res) => {
  if(req.user){
    const templateVars = {
      user : req.user,
      URLInfo: findURL(req.params.id),
    };
    if(templateVars.URLInfo){
      res.render('urls_show', templateVars);
    }else{
      res.redirect('/urls');
    }
  }else{
    res.sendError('You must be logged in to update a shortened URLs', true, 401);
  }
});

// UPDATE URL
app.put('/urls/:id', (req, res) => {
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
      res.sendError('You cannot update another users shortened URLs', false, 403);
    }
  }else{
    res.sendError('You must be logged in to update a shortened URLs', true, 401);
  }
});

// DELETE URL
app.delete('/urls/:id', (req, res) => {
  if(req.user){
    const shortURL = req.params.id;
    const usersURL = isUsersURL(shortURL, req);
    if(usersURL){
      urlDatabase = urlDatabase.filter(item => item.shortURL !== shortURL);
      res.redirect('/urls');
    }else{
      res.sendError('You cannot delete another users shortened URLs', false, 403);
    }

  }else{
    res.sendError('You must be logged in to delete a shortened URLs', false, 404);
  }
});

// URL TO REDIRECT SHORT URL TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const URLInfo = findURL(req.params.shortURL);
  const longURL = URLInfo.url;
  if(longURL){
    const visitor = req.session.id || req.session.anonymousUser;
    if(!URLInfo.visitors.find(item => item === visitor)){
      URLInfo.visitors.push(visitor);
    }
    URLInfo.visits.push({created: formatDate(new Date()), visitorId: visitor});
    console.log(URLInfo);
    res.redirect(longURL);
  }else{
     res.sendError(`The URL with id: ${req.params.shortURL} Not Found`, false, 404);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.sendError(`Not Found`, false, 404);
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

function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
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