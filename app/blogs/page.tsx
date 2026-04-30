import type { BlogPost } from "@/components/blogs/blog-data";
import { BlogsView } from "@/components/blogs/blogs-view";
import { mapApiRowToBlogPost } from "@/lib/blog-api";
import { queryAllBlogs } from "@/lib/blogs-db";

export const metadata = {
  title: "Blogs | Drone Hire",
  description:
    "News, product updates, and field notes from Drone Hire logistics and aerial operations.",
};

export default async function BlogsPage() {
  let initialApiPosts: BlogPost[] = [];
  try {
    const rows = await queryAllBlogs();
    initialApiPosts = rows.map(mapApiRowToBlogPost);
  } catch {
    /* DB unavailable on server — client will refetch */
  }
  return <BlogsView initialApiPosts={initialApiPosts} />;
}
