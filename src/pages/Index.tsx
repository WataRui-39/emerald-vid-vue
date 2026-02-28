import { useEffect, useState } from "react";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import CategoryChips from "@/components/CategoryChips";
import { supabase } from "@/integrations/supabase/client";

// Sample data for initial display
const sampleVideos = [
  { title: "Building a Modern Web App from Scratch", thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&q=80", channel: "CodeMaster", views: 245000, duration: "18:42", uploadedAt: "2 days ago" },
  { title: "Epic Mountain Trail Running Adventure", thumbnail: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=640&q=80", channel: "OutdoorVibes", views: 89000, duration: "24:15", uploadedAt: "5 days ago" },
  { title: "Lo-Fi Beats to Study and Relax To", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=640&q=80", channel: "ChillBeats", views: 1200000, duration: "3:45:00", uploadedAt: "1 week ago" },
  { title: "Gourmet Pasta Making - Italian Chef Secrets", thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=640&q=80", channel: "ChefMarco", views: 567000, duration: "12:30", uploadedAt: "3 days ago" },
  { title: "Understanding Quantum Computing Simply", thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&q=80", channel: "ScienceHub", views: 340000, duration: "22:18", uploadedAt: "1 day ago" },
  { title: "Street Photography Tips for Beginners", thumbnail: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=640&q=80", channel: "LensLife", views: 156000, duration: "15:45", uploadedAt: "4 days ago" },
  { title: "Full Body HIIT Workout - No Equipment", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640&q=80", channel: "FitZone", views: 890000, duration: "30:00", uploadedAt: "6 days ago" },
  { title: "Top 10 Hidden Gems in Southeast Asia", thumbnail: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=640&q=80", channel: "Wanderlust", views: 432000, duration: "19:55", uploadedAt: "1 week ago" },
];

const Index = () => {
  const [videos, setVideos] = useState<any[]>([]);

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
    : sampleVideos;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
        <CategoryChips />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {displayVideos.map((video, i) => (
            <VideoCard key={i} {...video} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
