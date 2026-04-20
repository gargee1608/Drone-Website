const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "drone_hire",
  password: "admin",
  port: 5432,
});

module.exports = pool;