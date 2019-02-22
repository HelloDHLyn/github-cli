const c = require('ansi-colors');
const { Input, Select } = require('enquirer');
const moment = require('moment');

const Prompter = require('./base');


module.exports = class IssuePrompter extends Prompter {
  constructor(repo, options) {
    super();

    this.repo = repo;
    this.options = options;

    this.state = {
      issue: {},
      pageInfo: {},
    };
  }

  /**
   * Prints list of issues.
   *
   * options:
   *   - everyone(boolean) : show issues assigned to everyone
   */
  async list(cursor) {
    // Get issues.
    let issues;
    let pageInfo;
    if (this.options.everyone) {
      const data = await super.query(`
        query {
          repository(owner: "${this.repo.owner}", name: "${this.repo.name}") {
            issues(${cursor || 'first: 15'}, states: [OPEN], orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes { number title state updatedAt }
              pageInfo { hasPreviousPage hasNextPage startCursor endCursor }
            }
          }
        }
      `);
      issues = data.repository.issues.nodes;
      ({ pageInfo } = data.search.pageInfo);
    } else {
      const data = await super.query(`
        query {
          search(${cursor || 'first: 15'}, query: "repo:${this.repo.owner}/${this.repo.name} assignee:${(await super.me()).login} is:issue is:open", type: ISSUE) {
            edges { node { ... on Issue { number title state updatedAt } } }
            pageInfo { hasPreviousPage hasNextPage startCursor endCursor }
          }
        }
      `);
      issues = data.search.edges.map(e => e.node);
      ({ pageInfo } = data.search.pageInfo);
    }
    if (issues.length === 0) {
      super.print('No issue found.');
      return;
    }

    // Update states.
    this.state.pageInfo = pageInfo;

    // Build prompt choices.
    const choices = issues.map(i => ({
      value: i.number,
      message: c.yellow(`[#${i.number}] `) + i.title + c.gray(` (${i.state})`),
    }));
    if (pageInfo.hasPreviousPage) {
      choices.push({ value: 'previous-page', message: 'See previous page...' });
    }
    if (pageInfo.hasNextPage) {
      choices.push({ value: 'next-page', message: 'See next page...' });
    }

    // Show prompt.
    const prompt = new Select({ name: 'Select issue', choices });
    const answer = await prompt.run();
    switch (answer) {
      case 'next-page':
        this.list(`after: "${pageInfo.endCursor}", first: 15`);
        break;
      case 'previous-page':
        this.list(`before: "${pageInfo.startCursor}", last: 15`);
        break;
      default:
        this.state.issue.number = answer;
        this.get();
    }
  }

  /**
   * Prints a single issue.
   */
  async get() {
    const data = await super.query(`
      query {
        repository(owner: "${this.repo.owner}", name: "${this.repo.name}") {
          issue(number: ${this.state.issue.number}) { 
            id number title body closed updatedAt
          }
        }
      }
    `);

    const { issue } = data.repository;
    this.state.issue.id = issue.id;

    super.print(`
      ${c.yellow(`[#${issue.number}]`)} ${c.bold(issue.title)}
      ${issue.closed ? c.red('CLOSED') : c.green('OPENED')} · ${moment(issue.updatedAt).fromNow()}

      ${issue.body ? issue.body : c.gray('Description not provided.')}
    `);

    const prompt = new Select({
      name: 'Select issue action',
      choices: [
        { value: 'see-comments', message: 'See comments' },
        { value: 'write-comment', message: 'Write a comment' },
      ],
    });

    switch (await prompt.run()) {
      case 'see-comments':
        this.listComment();
        break;
      case 'write-comment':
        this.writeComment();
        break;
      default:
        break;
    }
  }

  /**
   * Prints comments of the issue.
   */
  async listComment() {
    const data = await super.query(`
      query {
        repository(owner: "${this.repo.owner}", name: "${this.repo.name}") {
          issue(number: ${this.state.issue.number}) { 
            comments(first: 15) {
              nodes { author { login } body createdAt }
            }
          }
        }
      }
    `);

    const comments = data.repository.issue.comments.nodes;
    if (comments.length === 0) {
      super.print(c.gray('\nNo comments.\n'));
    } else {
      comments.forEach((comment) => {
        super.print(`
          ${c.bold(comment.author.login)} commented ${moment(comment.createdAt).fromNow()}
          ${comment.body}
        `);
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
        this.writeComment();
        break;
      default:
        break;
    }
  }

  /**
   * Write a comment to the issue.
   */
  async writeComment() {
    const prompt = new Input({
      name: 'comment',
      message: 'Write a comment',
      hint: 'Press <enter> twice to finish.',
      multiline: true,
    });

    await super.query(`
      mutation {
        addComment(input: {subjectId: "${this.state.issue.id}", body: """${await prompt.run()}\n\n> *sent from [github-cli](https://github.com/HelloDHLyn/github-cli)*"""}) {
          clientMutationId
        }
      }
    `);
    super.print('\nComment sent.\n');
  }
};
