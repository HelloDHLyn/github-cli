const axios = require('axios');
const util = require('util');

const endpoint = 'https://api.github.com/graphql';


function query(queryStr, ...args) {
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;
  if (!accessToken) {
    throw Error('Required to set `GITHUB_ACCESS_TOKEN` variable.');
  }

  const data = { query: util.format(queryStr, ...args) };
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return axios.post(endpoint, data, config);
}


module.exports = {};
module.exports.query = query;
