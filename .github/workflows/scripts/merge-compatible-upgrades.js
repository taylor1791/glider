module.exports = main;

async function main({ context, github }) {
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const workflow_run = context.payload.workflow_run;

  if (!workflow_run.pull_requests.length) {
    console.log(`Pull request is missing from workflow_run {run_id}`);
    return;
  }

  if (workflow_run.pull_requests.length > 1) {
    throw new Error("Completed Workflow ran on multiple pull requests");
  }

  const pull_number = workflow_run.pull_requests[0].number;

  await github.rest.pulls.merge({
    owner,
    repo,
    pull_number,
    merge_method: "rebase",
  });
}
