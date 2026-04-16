import Link from "next/link";
import { notFound } from "next/navigation";

import { postsBySlug } from "@/components/blogs/blog-data";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = postsBySlug[slug];
  if (!post) return { title: "Flight Log | Drone Hire" };
  return {
    title: `${post.title} | Blogs | Drone Hire`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = postsBySlug[slug];
  if (!post) notFound();

  return (
    <div
      className={cn(
        landingFontClassName,
        "blogs-hud-grid min-h-0 flex-1 bg-[#fcfcff] pt-22 text-[#1a1c1e] sm:pt-24"
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #f1f3f9 0%, #fcfcff 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#006a6e]">
          {post.category}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-landing-headline)] text-3xl font-extrabold tracking-tight text-[#1a1c1e] md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-[#41474d]">
          {post.date} · By {post.author}
        </p>
        <div className="mt-10 space-y-6 font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[#41474d]">
          {post.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <Link
          href="/blogs"
          className={cn(
            "mt-12 inline-block font-[family-name:var(--font-landing-headline)] text-sm font-bold uppercase tracking-widest text-[#006a6e] transition-colors hover:text-cyan-700"
          )}
        >
          ← Back to Flight Log
        </Link>
      </div>
    </div>
  );
}
