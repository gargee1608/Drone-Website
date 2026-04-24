import type { BlogApiRow } from "@/lib/blog-api";
import { getPgPool } from "@/lib/pg-pool";

export async function queryAllBlogs(): Promise<BlogApiRow[]> {
  const result = await getPgPool().query(
    "SELECT id, title, content, image, created_at FROM blogs ORDER BY id DESC"
  );
  return result.rows as BlogApiRow[];
}

export async function queryBlogById(id: number): Promise<BlogApiRow | null> {
  const result = await getPgPool().query(
    "SELECT id, title, content, image, created_at FROM blogs WHERE id = $1",
    [id]
  );
  return (result.rows[0] as BlogApiRow | undefined) ?? null;
}

export async function insertBlog(input: {
  title: string;
  content: string;
  image: string;
}): Promise<BlogApiRow> {
  const result = await getPgPool().query(
    `INSERT INTO blogs (title, content, image)
     VALUES ($1, $2, $3)
     RETURNING id, title, content, image, created_at`,
    [input.title, input.content, input.image]
  );
  return result.rows[0] as BlogApiRow;
}

export async function updateBlog(
  id: number,
  input: { title: string; content: string; image: string }
): Promise<BlogApiRow | null> {
  const result = await getPgPool().query(
    `UPDATE blogs
     SET title = $1, content = $2, image = $3
     WHERE id = $4
     RETURNING id, title, content, image, created_at`,
    [input.title, input.content, input.image, id]
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
