import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  category_id: number;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const [, setLocation] = useLocation();

  const { data: post, isLoading: postLoading, error: postError } = useQuery<BlogPost>({
    queryKey: [`/api/blog/posts/${params?.slug}`],
    enabled: !!params?.slug,
  });

  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ["/api/blog/categories"],
  });

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Uncategorized";
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading post...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (postError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold text-destructive">Failed to load blog post</h2>
            <p className="mt-2 text-muted-foreground">Please try again later.</p>
            <Button className="mt-4" onClick={() => setLocation("/blog")}>
              Back to Blog
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold">Blog post not found</h1>
            <Button className="mt-4" onClick={() => setLocation("/blog")}>
              Back to Blog
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/blog")}
          className="mb-6"
          data-testid="button-back-to-blog"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>

        <article>
          {post.featured_image && (
            <div className="mb-8 aspect-video overflow-hidden rounded-lg">
              <img
                src={post.featured_image}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover"
                data-testid="img-featured"
              />
            </div>
          )}

          <div className="mb-6">
            <Badge variant="secondary" className="mb-4" data-testid="badge-category">
              {getCategoryName(post.category_id)}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold" data-testid="text-title">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(post.published_at), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>AutoParts Kenya</span>
              </div>
            </div>
          </div>

          <div
            className="prose prose-slate max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
            data-testid="content-post"
          />
        </article>

        <div className="mt-12 border-t pt-8">
          <Button
            onClick={() => setLocation("/blog")}
            data-testid="button-more-posts"
          >
            Read More Posts
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
