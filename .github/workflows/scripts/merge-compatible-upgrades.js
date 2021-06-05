module.exports = main;

async function main({ context, github }) {
  let owner = context.payload.repository.owner.login;
  let repo = context.payload.repository.name;

  if (!context.payload.workflow_run.pull_requests.length) {
    return;
  }

  if (context.payload.workflow_run.pull_requests.length > 1) {
    throw new Error("Completed Workflow ran on multiple pull requests");
  }

  let pull_number = context.payload.workflow_run.pull_requests[0].number;

  await github.pulls.merge({
    owner,
    repo,
    pull_number,
    merge_method: "rebase",
  });
}
