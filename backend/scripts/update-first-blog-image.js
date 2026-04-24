/** One-off: set First Blog (id=1) cover image to site-local asset. */
const pool = require("../db");

const IMAGE = "/images/first-blog-cover.png";

async function main() {
  const r = await pool.query(
    "UPDATE blogs SET image = $1 WHERE id = 1 RETURNING id, title, image",
    [IMAGE]
  );
  console.log("Updated row:", r.rows[0]);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
