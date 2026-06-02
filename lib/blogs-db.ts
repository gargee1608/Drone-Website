import type { BlogStatus } from "@/components/blogs/blog-data";
import type { BlogApiRow } from "@/lib/blog-api";
import { normalizeBlogStatus } from "@/lib/blog-api";
import { getPgPool } from "@/lib/pg-pool";

const BLOG_ROW_SELECT =
  "id, title, content, image, created_at, status, author" as const;

let blogsSchemaReady: Promise<void> | null = null;

async function ensureBlogsSchema(): Promise<void> {
  if (!blogsSchemaReady) {
    blogsSchemaReady = (async () => {
      await getPgPool().query(`
        ALTER TABLE blogs
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
      `);
      await getPgPool().query(`
        ALTER TABLE blogs
        ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'Hire A Drone'
      `);
    })().catch((err) => {
      blogsSchemaReady = null;
      throw err;
    });
  }
  await blogsSchemaReady;
}

export async function queryAllBlogs(): Promise<BlogApiRow[]> {
  await ensureBlogsSchema();
  const result = await getPgPool().query(
    `SELECT ${BLOG_ROW_SELECT} FROM blogs ORDER BY id DESC`
  );
  return result.rows as BlogApiRow[];
}

export async function queryPublishedBlogs(): Promise<BlogApiRow[]> {
  await ensureBlogsSchema();
  const result = await getPgPool().query(
    `SELECT ${BLOG_ROW_SELECT}
     FROM blogs
     WHERE status IS NULL OR status = 'published'
     ORDER BY id DESC`
  );
  return result.rows as BlogApiRow[];
}

export async function queryBlogById(id: number): Promise<BlogApiRow | null> {
  await ensureBlogsSchema();
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
  author?: string;
  status?: BlogStatus;
}): Promise<BlogApiRow> {
  await ensureBlogsSchema();
  const status = normalizeBlogStatus(input.status);
  const author = input.author?.trim() || "Hire A Drone";
  const result = await getPgPool().query(
    `INSERT INTO blogs (title, content, image, status, author)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${BLOG_ROW_SELECT}`,
    [input.title, input.content, input.image, status, author]
  );
  return result.rows[0] as BlogApiRow;
}

export async function updateBlog(
  id: number,
  input: {
    title: string;
    content: string;
    image: string;
    author?: string;
    status?: BlogStatus;
  }
): Promise<BlogApiRow | null> {
  await ensureBlogsSchema();
  const status = normalizeBlogStatus(input.status);
  const author = input.author?.trim() || "Hire A Drone";
  const result = await getPgPool().query(
    `UPDATE blogs
     SET title = $1, content = $2, image = $3, status = $4, author = $5
     WHERE id = $6
     RETURNING ${BLOG_ROW_SELECT}`,
    [input.title, input.content, input.image, status, author, id]
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
