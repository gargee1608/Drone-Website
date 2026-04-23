const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const pool = new Pool({
  user: process.env.PGUSER || process.env.DB_USER || "postgres",
  host: process.env.PGHOST || process.env.DB_HOST || "localhost",
  database: process.env.PGDATABASE || process.env.DB_NAME || "drone_hire",
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || "admin",
  port:
    parseInt(String(process.env.PGPORT || process.env.DB_PORT || "5432"), 10) ||
    5432,
});

module.exports = pool;
