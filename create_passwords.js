const bcrypt = require('bcrypt');

console.log('polarbear');
console.log( bcrypt.hashSync('polarbear', 10));
console.log('grizzlybear');
console.log( bcrypt.hashSync('grizzlybear', 10));