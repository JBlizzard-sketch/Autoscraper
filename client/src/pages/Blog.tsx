import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
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

export default function Blog() {
  const [, setLocation] = useLocation();

  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<BlogCategory[]>({
    queryKey: ["/api/blog/categories"],
  });

  const isLoading = postsLoading || categoriesLoading;
  const hasError = postsError || categoriesError;

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Uncategorized";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading blog posts...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold text-destructive">Failed to load blog posts</h2>
            <p className="mt-2 text-muted-foreground">Please try again later.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" data-testid="text-blog-title">
            AutoParts Blog
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Tips, guides, and insights for vehicle maintenance
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              No blog posts available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="group overflow-hidden transition-all hover-elevate cursor-pointer"
                onClick={() => setLocation(`/blog/${post.slug}`)}
                data-testid={`card-blog-${post.id}`}
              >
                <CardContent className="p-0">
                  {post.featured_image && (
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        data-testid="img-blog-featured"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="secondary" data-testid="badge-category">
                        {getCategoryName(post.category_id)}
                      </Badge>
                    </div>
                    <h2
                      className="mb-2 line-clamp-2 text-xl font-bold"
                      data-testid="text-post-title"
                    >
                      {post.title}
                    </h2>
                    <p
                      className="mb-4 line-clamp-3 text-sm text-muted-foreground"
                      data-testid="text-post-excerpt"
                    >
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(post.published_at), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>AutoParts Kenya</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
