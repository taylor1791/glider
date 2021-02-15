const { retryUntil } = require("./utils");

module.exports = main;

async function main({ pollInterval, pollTimeout, log, context, github, env }) {
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const runId = +env.GITHUB_RUN_ID;

  const job = await getJob({
    runId,
    owner,
    repo,
    github,
  });

  const { status, checks } = await retryUntil(
    invariantChecksComplete.bind(null, {
      currentJobId: job.id,
      ref: env.GITHUB_HEAD_REF,
      owner,
      repo,
      github,
    }),
    pollTimeout / pollInterval,
    pollInterval
  );

  // As a sanity check, ensure the job that this runs in is in_progress
  invariantContainsInProgressCheck({ checkId: job.id, checks });

  if (status === "failure") {
    log("Dependabot update is UNSAFE to merge.");
    return;
  }

  log("Dependabot update is SAFE to merge.");
  github.pulls.merge({
    owner,
    repo,
    pull_number: context.payload.pull_request.number,
    merge_method: "rebase",
  });
}

function invariantContainsInProgressCheck({ checkId, checks }) {
  const job = checks.find((check) => check.id === checkId);
  if (!job) {
    throw new Error(`Job does not exist: ${checkId}`);
  }

  if (job.status !== "in_progress") {
    throw new Error(`Job is not in_progress: ${checkId}`);
  }
}

async function invariantChecksComplete({
  currentJobId,
  owner,
  repo,
  ref,
  github,
}) {
  const checks = await getChecks({
    owner,
    repo,
    ref,
    github,
  });
  const nonSelfChecks = checks.filter((check) => check.id !== currentJobId);

  let allPassed = true;
  for (let check of nonSelfChecks) {
    allPassed = allPassed && check.conclusion === "success";

    if (check.conclusion === "failure") {
      return { status: "failure", checks };
    }
  }

  if (allPassed) {
    return { status: "success", checks };
  }

  throw new Error("Jobs are still in progress");
}

async function getChecks({ owner, repo, ref, github }) {
  const checks = await github.checks.listForRef({ owner, repo, ref });

  return checks.data.check_runs;
}

async function getJob({ owner, repo, runId, github }) {
  const jobs = await github.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId,
  });

  const job = jobs.data.jobs.find((jobs) => jobs.run_id === runId);
  if (!job) {
    throw new Error(`Cannot find current job for workflow run id: ${runId}`);
  }

  return job;
}
