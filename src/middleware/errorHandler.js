function errorHandler(err, req, res, next) {
  console.error({
    requestId: req.requestId,
    message: err.message,
    stack: err.stack
  });

  res.status(err.status || 500).json({
    success: false,
    requestId: req.requestId,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "Unexpected server error"
    }
  });
}

module.exports = errorHandler;
