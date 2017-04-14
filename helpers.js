// HELPER FUNCTIONS
const moment = require('moment');

function generateRandomString(){
  let randomString = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 6; i > 0; --i) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
}

let lastId = 2;

function generateId(){
  lastId ++
  return lastId;
}

function formatDate(date) {
  return moment().format('MMM Do YY');
}

function getUserURLs(urlDatabase, userId){
  return urlDatabase.filter(url => url.userId === Number(userId));
}

function isUsersURL(urlDatabase, shortURL, req){
  const urlInfo = urlDatabase.find(url => url.userId === Number(req.session.id));
  return urlInfo?true:false;
}

function findURL(urlDatabase, shortURL){
  return urlDatabase.find(url => url.shortURL === shortURL);
}

module.exports = {
  generateRandomString: generateRandomString,
  generateId: generateId,
  formatDate: formatDate,
  getUserURLs: getUserURLs,
  isUsersURL: isUsersURL,
  findURL: findURL
}