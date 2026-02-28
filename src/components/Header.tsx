import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, LogOut, User, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality placeholder
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg font-['Space_Grotesk']">V</span>
          </div>
          <span className="hidden sm:block text-xl font-bold tracking-tight font-['Space_Grotesk'] text-foreground">
            VidFlow
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-6">
          <div className="relative w-full flex">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-r-none border-r-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" className="rounded-l-none gradient-primary border-0 text-primary-foreground">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/kids")}
                title="Kids Mode"
              >
                <Baby className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <button
                onClick={() => navigate("/profile")}
                className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <User className="h-4 w-4 text-secondary-foreground" />
              </button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground border-0">
              Sign In
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="flex">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-r-none border-r-0 bg-muted/50"
            />
            <Button type="submit" size="icon" className="rounded-l-none gradient-primary border-0 text-primary-foreground">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
