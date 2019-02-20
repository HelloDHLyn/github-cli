module.exports = {
  getViewer: `
  query {
    viewer { login }
  }`,

  listIssue: `
  query {
    repository(owner: "%s", name: "%s") {
      issues(first: 15, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes { number title state updatedAt }
      }
    }
  }`,

  listMyIssue: `
  query {
    search(query: "repo:%s/%s assignee:%s is:issue", type: ISSUE, first: 20) {
      edges {
        node {
          ... on Issue { number title state updatedAt }
        }
      }
    }
  }`,

  listIssueComment: `
  query {
    repository(owner: "%s", name: "%s") {
      issue(number: %d) { 
        id
        comments(first: 15) {
          nodes { author { login } body createdAt }
        }
      }
    }
  }`,

  getIssue: `
  query {
    repository(owner: "%s", name: "%s") {
      issue(number: %d) { 
        id title body closed updatedAt
      }
    }
  }`,

  addComment: `
  mutation {
    addComment(input: {subjectId: "%s", body: """%s"""}) {
      clientMutationId
    }
  }`,
};
