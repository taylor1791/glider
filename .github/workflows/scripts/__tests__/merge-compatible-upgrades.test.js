const main = require("../merge-compatible-upgrades");

jest.useFakeTimers();

describe("mere-compatible-upgrades", () => {
  const env = {
    GITHUB_RUN_ID: "570366385",
    GITHUB_HEAD_REF: "autobots",
  };
  const context = {
    payload: {
      pull_request: {
        number: 12,
      },
      repository: {
        name: "golden-disk",
        owner: {
          login: "earth",
        },
      },
    },
  };

  beforeEach(() => {
    const github = {
      actions: {
        listJobsForWorkflowRun: createListJobsForWorkflowRun(),
      },
      checks: {
        listForRef: createListForRef(),
      },
      pulls: {
        merge: jest.fn(),
      },
    };
    this.mainArgs = {
      pollInterval: 1000,
      pollTimeout: 0,
      log: jest.fn(),
      env,
      context,
      github,
    };
    this.log = jest.fn();
  });

  it("merges when all other checks are successful", async () => {
    const check_runs = createCheckRuns();
    this.mainArgs.github.checks.listForRef = createListForRef({ check_runs });

    await main(this.mainArgs);

    expect(this.mainArgs.github.pulls.merge).toHaveBeenCalledWith({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      pull_number: context.payload.pull_request.number,
      merge_method: "rebase",
    });
  });

  it("does not merge if checks fail", async () => {
    const check_runs = createCheckRuns();
    setFailed(check_runs[2]);
    this.mainArgs.github.checks.listForRef = createListForRef({ check_runs });

    await main(this.mainArgs);

    expect(this.mainArgs.github.pulls.merge).not.toHaveBeenCalledWith();
  });

  it("bails if current workflow does not have job", async () => {
    this.mainArgs.github.actions.listJobsForWorkflowRun = createListJobsForWorkflowRun(
      {
        jobs: [
          {
            id: Math.floor(Math.random() * 1000),
            run_id: Math.floor(Math.random() * 1000),
          },
        ],
      }
    );

    await expect(() => main(this.mainArgs)).rejects.toThrow(
      /Cannot find current job for workflow run id/
    );
  });

  it("bails if current job is not a check", async () => {
    const check_runs = createCheckRuns();
    check_runs[0].id = "not_a_valid_id";
    setComplete(check_runs[0]);
    this.mainArgs.github.checks.listForRef = createListForRef({ check_runs });

    await expect(() => main(this.mainArgs)).rejects.toThrow(
      /Job does not exist/
    );
  });

  it("bails if current job is not in_progress", async () => {
    const check_runs = createCheckRuns();
    setComplete(check_runs[0]);
    this.mainArgs.github.checks.listForRef = createListForRef({ check_runs });

    await expect(() => main(this.mainArgs)).rejects.toThrow(
      /Job is not in_progress/
    );
  });

  it("bails if timeout", async () => {
    const check_runs = createCheckRuns();
    setInProgress(check_runs[2]);
    this.mainArgs.github.checks.listForRef = createListForRef({ check_runs });

    await expect(() => main(this.mainArgs)).rejects.toThrow(
      /Jobs are still in progress/
    );
  });

  function createListJobsForWorkflowRun(data) {
    return function listJobsForWorkflowRun({ owner, repo, run_id }) {
      if (owner !== context.payload.repository.owner.login)
        throw new Error(`Unexpected owner: ${owner}`);
      if (repo !== context.payload.repository.name)
        throw new Error(`Unexpected repo: ${repo}`);
      if (run_id !== +env.GITHUB_RUN_ID)
        throw new Error(`Unexpected run_id: ${run_id}`);

      return {
        status: 200,
        data: {
          jobs: [
            {
              id: 1907730338,
              run_id: 570366385,
            },
          ],
          ...data,
        },
      };
    };
  }

  function createListForRef(data) {
    return function listForRef({ owner, repo, ref }) {
      if (owner !== context.payload.repository.owner.login)
        throw new Error(`Unexpected owner: ${owner}`);
      if (repo !== context.payload.repository.name)
        throw new Error(`Unexpected repo: ${repo}`);
      if (ref !== env.GITHUB_HEAD_REF)
        throw new Error(`Unexpected ref: ${ref}`);

      return {
        status: 200,
        data: {
          check_runs: createCheckRuns(),
          ...data,
        },
      };
    };
  }
});

function createCheckRuns() {
  return [
    {
      id: 1907730338,
      status: "in_progress",
      conclusion: null,
      name: "job 1",
    },
    {
      id: 1907730213,
      status: "in_progress",
      conclusion: "success",
      name: "job 2",
    },
    {
      id: 1907730180,
      status: "complete",
      conclusion: "success",
      name: "job 3",
    },
  ];
}

function setInProgress(check) {
  check.status = "in_progress";
  check.conclusion = null;
}

function setComplete(check) {
  check.status = "completed";
  check.conclusion = "success";
}

function setFailed(check) {
  check.status = "completed";
  check.conclusion = "failure";
}
