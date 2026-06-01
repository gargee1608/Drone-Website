import type { BlogStatus } from "@/components/blogs/blog-data";
import type { BlogApiRow } from "@/lib/blog-api";
import { normalizeBlogStatus } from "@/lib/blog-api";
import { getPgPool } from "@/lib/pg-pool";

const BLOG_ROW_SELECT =
  "id, title, content, image, created_at, status" as const;

let statusColumnReady: Promise<void> | null = null;

async function ensureBlogsStatusColumn(): Promise<void> {
  if (!statusColumnReady) {
    statusColumnReady = (async () => {
      await getPgPool().query(`
        ALTER TABLE blogs
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
      `);
    })().catch((err) => {
      statusColumnReady = null;
      throw err;
    });
  }
  await statusColumnReady;
}

export async function queryAllBlogs(): Promise<BlogApiRow[]> {
  await ensureBlogsStatusColumn();
  const result = await getPgPool().query(
    `SELECT ${BLOG_ROW_SELECT} FROM blogs ORDER BY id DESC`
  );
  return result.rows as BlogApiRow[];
}

export async function queryPublishedBlogs(): Promise<BlogApiRow[]> {
  await ensureBlogsStatusColumn();
  const result = await getPgPool().query(
    `SELECT ${BLOG_ROW_SELECT}
     FROM blogs
     WHERE status IS NULL OR status = 'published'
     ORDER BY id DESC`
  );
  return result.rows as BlogApiRow[];
}

export async function queryBlogById(id: number): Promise<BlogApiRow | null> {
  await ensureBlogsStatusColumn();
  const result = await getPgPool().query(
    `SELECT ${BLOG_ROW_SELECT} FROM blogs WHERE id = $1`,
    [id]
  );
  return (result.rows[0] as BlogApiRow | undefined) ?? null;
}

export async function insertBlog(input: {
  title: string;
  content: string;
  image: string;
  status?: BlogStatus;
}): Promise<BlogApiRow> {
  await ensureBlogsStatusColumn();
  const status = normalizeBlogStatus(input.status);
  const result = await getPgPool().query(
    `INSERT INTO blogs (title, content, image, status)
     VALUES ($1, $2, $3, $4)
     RETURNING ${BLOG_ROW_SELECT}`,
    [input.title, input.content, input.image, status]
  );
  return result.rows[0] as BlogApiRow;
}

export async function updateBlog(
  id: number,
  input: {
    title: string;
    content: string;
    image: string;
    status?: BlogStatus;
  }
): Promise<BlogApiRow | null> {
  await ensureBlogsStatusColumn();
  const status = normalizeBlogStatus(input.status);
  const result = await getPgPool().query(
    `UPDATE blogs
     SET title = $1, content = $2, image = $3, status = $4
     WHERE id = $5
     RETURNING ${BLOG_ROW_SELECT}`,
    [input.title, input.content, input.image, status, id]
  );
  return (result.rows[0] as BlogApiRow | undefined) ?? null;
}

export async function deleteBlogById(id: number): Promise<boolean> {
  const result = await getPgPool().query(
    "DELETE FROM blogs WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows.length > 0;
}
