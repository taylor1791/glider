const main = require("../merge-compatible-upgrades");

jest.useFakeTimers();

describe("mere-compatible-upgrades", () => {
  let mainArgs;
  beforeEach(() => {
    const github = {
      pulls: {
        merge: jest.fn(),
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
          pull_requests: [{ number: 12 }],
        },
      },
    };

    mainArgs = {
      context,
      github,
    };
  });

  it("does not attempt to merge non-pull requests", async () => {
    mainArgs.context.payload.workflow_run.pull_requests = [];

    await main(mainArgs);
    expect(mainArgs.github.pulls.merge).not.toHaveBeenCalled();
  });

  it("errors when a single workflow is associated with multiple PRs", async () => {
    mainArgs.context.payload.workflow_run.pull_requests = [{}, {}];

    await expect(main(mainArgs)).rejects.toThrow();
  });

  it("merges pull requests", async () => {
    await main(mainArgs);

    expect(mainArgs.github.pulls.merge).toHaveBeenCalledWith({
      owner: mainArgs.context.payload.repository.owner.login,
      repo: mainArgs.context.payload.repository.name,
      pull_number:
        mainArgs.context.payload.workflow_run.pull_requests[0].number,
      merge_method: "rebase",
    });
  });
});
