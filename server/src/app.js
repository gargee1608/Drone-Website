import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

/** Allow comma-separated CLIENT_ORIGIN; in non-production, any localhost/127.0.0.1 origin (any port) so Next on 3001 still works. */
function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  const fromEnv = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.includes(origin)) {
    callback(null, true);
    return;
  }
  if (
    process.env.NODE_ENV !== "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    callback(null, true);
    return;
  }
  callback(new Error("Not allowed by CORS"));
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "aerolaminar-auth-api" });
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;
