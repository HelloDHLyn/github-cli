
const c = require('ansi-colors');
const Console = require('console');
const { Select } = require('enquirer');

const { query } = require('../github');
const queries = require('../quries');


async function promptIssueId(repo, options) {
  let issues;
  if (options.all) {
    const args = [repo.owner, repo.name];
    const res = await query(queries.listIssue, ...args);
    issues = res.data.data.repository.issues.nodes;
  } else {
    const viewerRes = await query(queries.getViewer);

    const args = [repo.owner, repo.name, viewerRes.data.data.viewer.login];
    const res = await query(queries.listMyIssue, ...args);
    issues = res.data.data.search.edges.map(e => e.node);
  }

  const prompt = new Select({
    name: 'Issues',
    choices: issues.map(i => ({
      message: c.yellow(`[#${i.number}] `) + i.title + c.gray(` (${i.state})`),
      value: i.number,
    })),
  });

  return prompt.run();
}

async function promptIssueAction(repo, issueId) {
  const args = [repo.owner, repo.name, issueId];
  const res = await query(queries.getIssue, ...args);

  const { issue } = res.data.data.repository;
  Console.log(`
    ${c.bold('TITLE')}
    ${issue.title}

    ${c.bold('DESCRIPTION')}
    ${issue.body ? issue.body : c.gray('Not provided.')}
  `.replace(/^ */gm, '  '));
}

async function action(repo, options) {
  const issueId = await promptIssueId(repo, options);
  promptIssueAction(repo, issueId);
}

module.exports = action;
