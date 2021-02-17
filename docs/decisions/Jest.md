Jest is a controversial test runner.
It trades speed for isolation by using separate processes for test suites.
This provides isolation between test suites executed in parallel, but can cover-up code that leaks state.
However, Jest is "fast enough" for most use cases and has the best developer experience out of all JavaScript test runners.
It has build in code coverage, file transformations, mocking, fake timers, async assertions, and more.
Its biggest problem is its tight coupling to Node, making it difficult to run tests in a browser.
If running tests across a suite of browsers is more important than developer experience, consider using another testing framework.
