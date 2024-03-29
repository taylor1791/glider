const main = require("../merge-compatible-upgrades");

jest.useFakeTimers();

describe("mere-compatible-upgrades", () => {
  let mainArgs;
  beforeEach(() => {
    console.log = jest.fn();

    const github = {
      rest: {
        pulls: {
          merge: jest.fn(),
        },
      },
    };

    const context = {
      payload: {
        repository: {
          name: "golden-disk",
          owner: {
            login: "earth",
          },
        },
        workflow_run: {
          pull_requests: [{ number: 1977 }],
        },
      },
      runId: 2,
    };

    mainArgs = {
      context,
      github,
    };
  });

  it("does not attempt to merge non-pull requests", async () => {
    mainArgs.context.payload.workflow_run.pull_requests = [];

    await main(mainArgs);
    expect(mainArgs.github.rest.pulls.merge).not.toHaveBeenCalled();
  });

  it("errors when a single workflow is associated with multiple PRs", async () => {
    mainArgs.context.payload.workflow_run.pull_requests = [{}, {}];

    await expect(main(mainArgs)).rejects.toThrow();
  });

  it("merges pull requests", async () => {
    await main(mainArgs);

    expect(mainArgs.github.rest.pulls.merge).toHaveBeenCalledWith({
      owner: mainArgs.context.payload.repository.owner.login,
      repo: mainArgs.context.payload.repository.name,
      pull_number: 1977,
      merge_method: "rebase",
    });
  });
});
