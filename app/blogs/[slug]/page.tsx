import { postsBySlug } from "@/components/blogs/blog-data";
import { BlogPostPageClient } from "@/components/blogs/blog-post-page-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
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
  const initialPost = postsBySlug[slug] ?? null;
  return <BlogPostPageClient slug={slug} initialPost={initialPost} />;
}
