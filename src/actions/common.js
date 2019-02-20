const Console = require('console');


function print(text) {
  Console.log(text.replace(/^ */gm, '  '));
}


module.exports = {};
module.exports.print = print;
