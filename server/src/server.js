import app from "./app.js";
import { initUsersFromEnv } from "./stores/userStore.js";

const PORT = Number(process.env.PORT) || 4000;

try {
  await initUsersFromEnv();
  app.listen(PORT, () => {
    console.log(
      `Auth API listening on http://localhost:${PORT} (in-memory users & OTPs; no database)`
    );
  });
} catch (e) {
  console.error("Failed to start server:", e);
  process.exit(1);
}
