module.exports = {
  listIssue: `
  query {
    repository(owner: "%s", name: "%s") {
      issues(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
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

  getIssue: `
  query {
    repository(owner: "%s", name: "%s") {
      issue(number: %d) { number title state body updatedAt }
    }
  }`,

  getViewer: `
  query {
    viewer { login }
  }`,
};
