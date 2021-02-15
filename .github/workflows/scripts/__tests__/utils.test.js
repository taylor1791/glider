const { sleep, retryUntil } = require("../utils");

jest.useFakeTimers();

describe("sleep", () => {
  afterEach(() => {
    jest.runAllTimers();
  });

  it("starts pending", async () => {
    let resolved = false;
    sleep(1000).then(() => (resolved = true));

    await emptyMicrotaskQueue();

    expect(resolved).toBe(false);
  });

  it("stays pending for the duration", async () => {
    let resolved = false;
    sleep(1000).then(() => (resolved = true));

    jest.advanceTimersByTime(999);
    await emptyMicrotaskQueue();

    expect(resolved).toBe(false);
  });

  it("fulfills after duration", async () => {
    let resolved = false;
    sleep(1000).then(() => (resolved = true));

    jest.advanceTimersByTime(1000);
    await emptyMicrotaskQueue();

    expect(resolved).toBe(true);
  });
});

describe("retryUntil", () => {
  it("fulfills when fn fulfills", async () => {
    const value = Math.random();
    const fn = failTimes(0, value);
    const tryCount = 0;
    const delay = 1000;

    await expect(retryUntil(fn, tryCount, delay)).resolves.toBe(value);
  });

  it("retries if the function rejects", async () => {
    const value = Math.random();
    const fn = failTimes(1, value);
    const tryCount = 1;
    const delay = 0;

    await expect(retryUntil(fn, tryCount, delay)).resolves.toBe(value);
  });

  it("rejects after exceeding retries", async () => {
    const value = Math.random();
    const fn = failTimes(6, undefined, value);
    const tryCount = 5;
    const delay = 0;

    await expect(retryUntil(fn, tryCount, delay)).rejects.toBe(value);
  });

  it("can delay after failing", async () => {
    const value = Math.random();
    const fn = failTimes(1, value);
    const tryCount = 1;
    const delay = 1000;

    const result = retryUntil(fn, tryCount, delay);
    await emptyMicrotaskQueue();
    jest.advanceTimersByTime(1000);

    await expect(result).resolves.toBe(value);
  });

  it("respects predicate functions", async () => {
    const value = Math.random();
    let shouldReject = true;
    const fn = () => (shouldReject ? Promise.reject() : Promise.resolve(value));
    const predicate = () => !shouldReject;
    const delay = 1000;

    const result = retryUntil(fn, predicate, delay);
    await emptyMicrotaskQueue();
    shouldReject = false;
    jest.advanceTimersByTime(1000);

    await expect(result).resolves.toBe(value);
  });

  it("respects delay functions", async () => {
    const value = Math.random();
    const fn = failTimes(4, value);
    const delayFn = (failCount) => Math.pow(10, failCount - 1);

    const result = retryUntil(fn, 5, delayFn);

    await emptyAndAdvance(1);
    await emptyAndAdvance(10);
    await emptyAndAdvance(100);
    await emptyAndAdvance(1000);

    await expect(result).resolves.toBe(value);
  });

  function failTimes(n, fulfillValue, rejectValue) {
    let count = 0;

    return function () {
      const result =
        count < n ? Promise.reject(rejectValue) : Promise.resolve(fulfillValue);

      count += 1;
      return result;
    };
  }

  async function emptyAndAdvance(n) {
    await emptyMicrotaskQueue();
    jest.advanceTimersByTime(n);
  }
});

async function emptyMicrotaskQueue() {
  await Promise.resolve();
}
