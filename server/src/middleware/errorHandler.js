export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || "SERVER_ERROR";
  const message =
    status === 500 && process.env.NODE_ENV !== "development"
      ? "Internal server error"
      : err.message || "Something went wrong";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    ok: false,
    code,
    message,
  });
}
