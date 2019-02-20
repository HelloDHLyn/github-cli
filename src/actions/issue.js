const c = require('ansi-colors');
const { Input, Select } = require('enquirer');
const moment = require('moment');

const { print } = require('./common');
const { query } = require('../github');
const queries = require('../quries');

const state = {};


async function promptIssueList(options) {
  let issues;
  if (options.all) {
    const args = [state.repo.owner, state.repo.name];
    const res = await query(queries.listIssue, ...args);
    issues = res.data.data.repository.issues.nodes;
  } else {
    const viewerRes = await query(queries.getViewer);

    const args = [state.repo.owner, state.repo.name, viewerRes.data.data.viewer.login];
    const res = await query(queries.listMyIssue, ...args);
    issues = res.data.data.search.edges.map(e => e.node);
  }

  if (issues.length == 0) {
    print('No issue found.');
    return;
  }

  const prompt = new Select({
    name: 'Select issue',
    choices: issues.map(i => ({
      message: c.yellow(`[#${i.number}] `) + i.title + c.gray(` (${i.state})`),
      value: i.number,
    })),
  });

  state.issueNum = await prompt.run();
  promptIssue();
}

async function promptIssue() {
  const args = [state.repo.owner, state.repo.name, state.issueNum];
  const res = await query(queries.getIssue, ...args);

  const { issue } = res.data.data.repository;
  print(`
    ${c.yellow(`[#${state.issueNum}]`)} ${c.bold(issue.title)}
    ${issue.closed ? c.red('CLOSED') : c.green('OPENED')} · ${moment(issue.updatedAt).fromNow()}

    ${issue.body ? issue.body : c.gray('Description not provided.')}
  `.replace(/^ */gm, '  '));

  const prompt = new Select({
    name: 'Select issue action',
    choices: [
      { value: 'see-comments', message: 'See comments' },
      { value: 'write-comment', message: 'Write a comment' },
    ],
  });

  switch (await prompt.run()) {
    case 'see-comments':
      promptIssueCommentList();
      break;
    case 'write-comment':
      promptWriteComment(issue.id);
      break;
  }
}

async function promptIssueCommentList() {
  const args = [state.repo.owner, state.repo.name, state.issueNum];
  const res = await query(queries.listIssueComment, ...args);

  const issue = res.data.data.repository.issue;
  const comments = issue.comments.nodes;
  if (comments.length === 0) {
    print(c.gray('\n  No comments.\n'))
  } else {
    comments.forEach((comment) => {
      print(`
        ${c.bold(comment.author.login)} commented ${moment(comment.createdAt).fromNow()}
        ${comment.body}
      `.replace(/^ */gm, '  '));
    });
  }

  const prompt = new Select({
    name: 'Select comment action',
    choices: [
      { value: 'write-comment', message: 'Write a comment' },
    ],
  });

  switch (await prompt.run()) {
    case 'write-comment':
      promptWriteComment(issue.id);
      break;    
  }
}

async function promptWriteComment(nodeId) {
  const prompt = new Input({
    name: 'comment',
    message: 'Write a comment',
  });

  const args = [nodeId, await prompt.run() + '\n\n' + '> *sent from [github-cli](https://github.com/HelloDHLyn/github-cli)*'];
  await query(queries.addComment, ...args);
  
  print('\n  Comment sent.\n');
}

async function action(repo, options) {
  state.repo = repo;
  promptIssueList(options);
}


module.exports = action;
