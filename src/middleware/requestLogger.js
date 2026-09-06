const { v4: uuidv4 } = require("uuid");

function requestLogger(req, res, next) {
  const requestId = uuidv4();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const started = Date.now();

  res.on("finish", () => {
    const elapsed = Date.now() - started;
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        elapsedMs: elapsed
      })
    );
  });

  next();
}

module.exports = requestLogger;
