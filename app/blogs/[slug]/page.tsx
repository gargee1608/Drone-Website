import { postsBySlug } from "@/components/blogs/blog-data";
import { BlogPostPageClient } from "@/components/blogs/blog-post-page-client";
import {
  isBlogPostPublished,
  mapApiRowToBlogPost,
  parseBlogDbSlug,
} from "@/lib/blog-api";
import { queryBlogById } from "@/lib/blogs-db";

/** Admin edits DB-backed posts; always resolve from the database. */
export const dynamic = "force-dynamic";

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
      if (isBlogPostPublished(post)) {
        return {
          title: `${post.title} | Blogs | Hire A Drone`,
          description: post.excerpt,
        };
      }
    }
    return {
      title: "Flight Log | Hire A Drone",
      description: "Hire A Drone news and field notes.",
    };
  }
  const post = postsBySlug[slug];
  if (!post) {
    return {
      title: "Flight Log | Hire A Drone",
      description: "Hire A Drone news and field notes.",
    };
  }
  return {
    title: `${post.title} | Blogs | Hire A Drone`,
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
      if (row) {
        const mapped = mapApiRowToBlogPost(row);
        if (isBlogPostPublished(mapped)) initialPost = mapped;
      }
    } catch {
      /* DB unavailable */
    }
  }
  return <BlogPostPageClient slug={slug} initialPost={initialPost} />;
}
