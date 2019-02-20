#!/usr/bin/env node

const { execSync } = require('child_process');
const commander = require('commander');
const Console = require('console');
const GitUrlParse = require('git-url-parse');

const issueAction = require('./actions/issue');

let currentRepo;


function initialize() {
  // Get git repository information.
  let gitUrl;
  try {
    gitUrl = execSync('git remote get-url origin');
  } catch (_) {
    Console.log('Failed to get remote url. Please check the directory.');
    process.exit(1);
  }

  currentRepo = GitUrlParse(gitUrl.toString());
  if (currentRepo.resource !== 'github.com') {
    Console.log('Remote repository is not on github.');
    process.exit(1);
  }
}


initialize();

commander
  .command('issue')
  .description('manage issues on repository')
  .option('--all', 'include issues not assigend to me')
  .action((_, options) => issueAction(currentRepo, options || {}));

if (process.argv.length < 3) {
  commander.help();
} else {
  commander.parse(process.argv);
}
