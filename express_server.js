const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// CONFIGURATION
app.set('view engine', 'ejs');
// MIDDLEWARES
app.use(bodyParser.urlencoded({extended: true}));

// URLS GET ROUTE HANDLER
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// URLS POST ROUTE HANDLER
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  if(shortURL && longURL){
    urlDatabase[shortURL] = longURL;
  }
  res.redirect(`/urls/${shortURL}`);
});

// URL TO CREATE NEW URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// URL WITH ID ROUTE HANDLER
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  if(templateVars.longURL){
    res.render('urls_show', templateVars);
  }else{
    res.redirect('/urls');
  }
});

// URL WITH ID TO UPDATE ROUTE HANDLER
app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  if(longURL){
    urlDatabase[shortURL] = longURL;
  }
  res.redirect('/urls');
});

// URL WITH ID TO DELETE ROUTE HANDLER
app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if(longURL){
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');

});

// URL TO REDIRECT SHORT URL TO LONG URL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if(longURL){
    res.redirect(longURL);
  }else{
     res.redirect('/urls');
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