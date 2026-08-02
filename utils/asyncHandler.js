// Pass rejected async operations to the error handler
module.exports = function asyncHandler(handler) {
  return function handledRequest(req, res, next) {
    Promise.resolve(
      handler(req, res, next)
    ).catch(next);
  };
};
