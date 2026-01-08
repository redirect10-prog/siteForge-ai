import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Trash2, Loader2, Globe, Edit3, Pencil } from "lucide-react";
import { toast } from "sonner";

const FREE_EDIT_LIMIT = 3;

interface Website {
  id: string;
  slug: string;
  prompt: string;
  website_type: string | null;
  tier: string | null;
  edit_count: number;
  created_at: string;
}

export default function MyWebsites() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user]);

  const fetchWebsites = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("generated_websites")
      .select("id, slug, prompt, website_type, tier, edit_count, created_at")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching websites:", error);
      toast.error("Failed to load your websites");
    } else {
      setWebsites(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase
      .from("generated_websites")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting website:", error);
      toast.error("Failed to delete website");
    } else {
      setWebsites((prev) => prev.filter((w) => w.id !== id));
      toast.success("Website deleted");
    }
    setDeletingId(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header tier="free" requestsUsed={0} requestsLimit={3} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Generator
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Websites</h1>
            <p className="text-muted-foreground">
              Manage and view all your generated websites
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No websites yet</h2>
              <p className="text-muted-foreground mb-6">
                Start generating websites and they'll appear here
              </p>
              <Link to="/">
                <Button variant="gradient" className="relative z-10">
                  <span className="relative z-10">Create Your First Website</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {websites.map((website) => (
                <div
                  key={website.id}
                  className="glass-card p-6 flex flex-col gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium uppercase tracking-wider text-primary">
                        {website.website_type || "Website"}
                      </div>
                      {(!website.tier || website.tier === "free") && (
                        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          (FREE_EDIT_LIMIT - (website.edit_count || 0)) > 0
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          <Edit3 className="h-3 w-3" />
                          {Math.max(0, FREE_EDIT_LIMIT - (website.edit_count || 0))} edits left
                        </div>
                      )}
                    </div>
                    <p className="text-foreground font-medium line-clamp-2">
                      {website.prompt}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(website.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to={`/edit/${website.id}`} 
                      className="flex-1"
                    >
                      <Button 
                        variant="gradient" 
                        size="sm" 
                        className="w-full gap-2 relative z-10"
                        disabled={(!website.tier || website.tier === "free") && (website.edit_count || 0) >= FREE_EDIT_LIMIT}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </span>
                      </Button>
                    </Link>
                    <Link to={`/site/${website.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(website.id)}
                      disabled={deletingId === website.id}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {deletingId === website.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
