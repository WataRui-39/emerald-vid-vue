import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Home, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoCard from "@/components/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const kidCategories = [
  "All", "Cartoons", "Animals", "Music", "Learning", "Stories", "Science", "Art",
];

const sampleKidsVideos = [
  { title: "Learn Colors with Fun Animals! 🌈", thumbnail: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=640&q=80", channel: "KidsWorld", views: 1500000, duration: "8:20", uploadedAt: "1 day ago" },
  { title: "Baby Shark Dance Along 🦈", thumbnail: "https://images.unsplash.com/photo-1518877593221-1f28583780b4?w=640&q=80", channel: "TinyTunes", views: 5200000, duration: "3:45", uploadedAt: "3 days ago" },
  { title: "Dinosaur Adventures for Kids 🦕", thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&q=80", channel: "DinoFun", views: 890000, duration: "12:10", uploadedAt: "5 days ago" },
  { title: "Counting 1 to 100 with Puppets!", thumbnail: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=640&q=80", channel: "LearnPlay", views: 2100000, duration: "10:30", uploadedAt: "2 days ago" },
  { title: "Magical Science Experiments ✨", thumbnail: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=640&q=80", channel: "ScienceKids", views: 670000, duration: "15:00", uploadedAt: "1 week ago" },
  { title: "Storytime: The Brave Little Fox 🦊", thumbnail: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=640&q=80", channel: "StoryTime", views: 430000, duration: "7:45", uploadedAt: "4 days ago" },
  { title: "Drawing Animals Step by Step 🎨", thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=80", channel: "ArtForKids", views: 920000, duration: "18:00", uploadedAt: "6 days ago" },
  { title: "Sing Along Nursery Rhymes 🎵", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=640&q=80", channel: "TinyTunes", views: 3400000, duration: "25:00", uploadedAt: "1 week ago" },
];

const Kids = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setVideos(data);
      }
    };
    fetchVideos();
  }, []);

  const displayVideos = videos.length > 0
    ? videos.map((v) => ({
        title: v.title,
        thumbnail: v.thumbnail_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=640&q=80",
        channel: "User",
        views: v.views,
        duration: `${Math.floor((v.duration || 0) / 60)}:${String((v.duration || 0) % 60).padStart(2, "0")}`,
        uploadedAt: new Date(v.created_at).toLocaleDateString(),
      }))
    : sampleKidsVideos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(210,80%,95%)] to-[hsl(155,60%,95%)]">
      {/* Kids Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[hsl(0,0%,100%)]/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/home" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[hsl(210,80%,55%)] to-[hsl(155,60%,50%)] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[hsl(0,0%,100%)]" />
            </div>
            <span className="text-xl font-bold tracking-tight font-['Space_Grotesk'] text-foreground">
              VidFlow <span className="text-secondary">Kids</span>
            </span>
          </Link>

          <form onSubmit={(e) => e.preventDefault()} className="hidden sm:flex flex-1 max-w-md mx-6">
            <div className="relative w-full flex">
              <Input
                placeholder="Search kid-safe videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-r-none border-r-0 bg-muted/50 rounded-full focus-visible:ring-1 focus-visible:ring-secondary"
              />
              <Button type="submit" size="icon" className="rounded-l-none rounded-full bg-secondary text-secondary-foreground border-0 hover:bg-secondary/90">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <Link to="/home">
            <Button variant="outline" className="gap-2 rounded-full">
              <Home className="h-4 w-4" /> Back to Main
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero banner */}
      <div className="px-4 md:px-6 py-6 max-w-[1800px] mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-[hsl(210,80%,55%)] to-[hsl(155,60%,50%)] p-8 md:p-12 mb-6 shadow-elevated">
          <h1 className="text-3xl md:text-4xl font-bold text-[hsl(0,0%,100%)] font-['Space_Grotesk'] mb-2">
            Hey there! 👋
          </h1>
          <p className="text-[hsl(0,0%,100%)]/80 text-lg">
            Discover awesome videos just for you! 🎉
          </p>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {kidCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-secondary text-secondary-foreground shadow-md scale-105"
                  : "bg-[hsl(0,0%,100%)] text-foreground hover:bg-accent border border-border"
              }`}
            >
              {cat === "All" && <Star className="h-3.5 w-3.5" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {displayVideos.map((video, i) => (
            <VideoCard key={i} {...video} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kids;
