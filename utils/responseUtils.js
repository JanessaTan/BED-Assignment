// Send a successful JSON response
function success(res, statusCode, message, data, meta) {
  const body = {
    success: true,
    message
  };

  // Add data when it is provided
  if (data !== undefined) body.data = data;

  // Add extra information when it is provided
  if (meta !== undefined) body.meta = meta;

  return res.status(statusCode).json(body);
}

// Send a successful creation response
function created(res, message, data) {
  return success(
    res,
    201,
    message,
    data
  );
}

module.exports = {
  success,
  created
};
