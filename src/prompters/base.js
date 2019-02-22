const axios = require('axios');
const Console = require('console');
const util = require('util');

const githubEndpoint = 'https://api.github.com/graphql';


module.exports = class Prompter {
  static print(text) {
    Console.log(text.replace(/^ */gm, '  '));
  }

  static query(queryStr, ...args) {
    const accessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!accessToken) {
      throw Error('Required to set `GITHUB_ACCESS_TOKEN` variable.');
    }

    const data = { query: util.format(queryStr, ...args) };
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.starfire-preview+json',
      },
    };

    return new Promise((resolve, reject) => {
      axios.post(githubEndpoint, data, config)
        .then((res) => {
          if (res.data.errors) {
            if (process.env.DEBUG) {
              Console.log(res.data.errors);
            }
            reject(res.data.errors);
          } else {
            resolve(res.data.data);
          }
        })
        .catch(e => reject(e));
    });
  }

  async me() {
    const data = await this.query('query { viewer { login } }');
    return data.viewer;
  }
};
