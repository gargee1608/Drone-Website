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

  const body = {
    ok: false,
    code,
    message,
  };
  if (err.signInError === "email" || err.signInError === "password") {
    body.signInError = err.signInError;
  }
  res.status(status).json(body);
}
