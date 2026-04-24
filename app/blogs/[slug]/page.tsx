import { postsBySlug } from "@/components/blogs/blog-data";
import { BlogPostPageClient } from "@/components/blogs/blog-post-page-client";
import { mapApiRowToBlogPost, parseBlogDbSlug } from "@/lib/blog-api";
import { queryBlogById } from "@/lib/blogs-db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const dbId = parseBlogDbSlug(slug);
  if (dbId != null) {
    let row = null;
    try {
      row = await queryBlogById(dbId);
    } catch {
      row = null;
    }
    if (row) {
      const post = mapApiRowToBlogPost(row);
      return {
        title: `${post.title} | Blogs | Drone Hire`,
        description: post.excerpt,
      };
    }
    return {
      title: "Flight Log | Drone Hire",
      description: "Drone Hire news and field notes.",
    };
  }
  const post = postsBySlug[slug];
  if (!post) {
    return {
      title: "Flight Log | Drone Hire",
      description: "Drone Hire news and field notes.",
    };
  }
  return {
    title: `${post.title} | Blogs | Drone Hire`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let initialPost = postsBySlug[slug] ?? null;
  const dbId = parseBlogDbSlug(slug);
  if (dbId != null && !initialPost) {
    try {
      const row = await queryBlogById(dbId);
      if (row) initialPost = mapApiRowToBlogPost(row);
    } catch {
      /* DB unavailable */
    }
  }
  return <BlogPostPageClient slug={slug} initialPost={initialPost} />;
}
