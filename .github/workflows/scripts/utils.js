module.exports.retryUntil = retryUntil;
module.exports.sleep = sleep;

async function retryUntil(fn, predicate, delay) {
  const predicateFn =
    typeof predicate === "number"
      ? (failedCount) => failedCount > predicate
      : predicate;
  const delayFn = typeof delay !== "function" ? () => delay : delay;

  let failedCount = 0;
  while (true) {
    const { isError, err, result } = await fn().then(
      (result) => ({ result, isError: false }),
      (err) => ({ err, isError: true })
    );

    if (!isError) {
      return result;
    }

    failedCount++;
    if (predicateFn(failedCount)) {
      throw err;
    }

    let delayDuration = delayFn(failedCount);
    if (delayDuration) {
      await sleep(delayDuration);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
