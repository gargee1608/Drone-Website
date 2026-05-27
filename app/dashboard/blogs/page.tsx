import type { BlogPost } from "@/components/blogs/blog-data";
import { AdminBlogsView } from "@/components/dashboard/admin-blogs-view";
import { mapApiRowToBlogPost } from "@/lib/blog-api";
import { queryAllBlogs } from "@/lib/blogs-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hire A Drone | Manage Blogs",
  description: "Create and edit Flight Log posts from the admin command center.",
};

export default async function DashboardBlogsPage() {
  let initialApiPosts: BlogPost[] = [];
  try {
    const rows = await queryAllBlogs();
    initialApiPosts = rows.map(mapApiRowToBlogPost);
  } catch {
    /* Client refresh will retry; built-in posts still appear */
  }
  return <AdminBlogsView initialApiPosts={initialApiPosts} />;
}
