import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import CategoryChips from "@/components/CategoryChips";
import { supabase } from "@/integrations/supabase/client";

const sampleVideos = [
  { id: "s1", title: "Building a Modern Web App from Scratch", thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&q=80", channel: "CodeMaster", channelUserId: "", views: 245000, duration: "18:42", uploadedAt: "2 days ago", category: "Technology" },
  { id: "s2", title: "Epic Mountain Trail Running Adventure", thumbnail: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=640&q=80", channel: "OutdoorVibes", channelUserId: "", views: 89000, duration: "24:15", uploadedAt: "5 days ago", category: "Sports" },
  { id: "s3", title: "Lo-Fi Beats to Study and Relax To", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=640&q=80", channel: "ChillBeats", channelUserId: "", views: 1200000, duration: "3:45:00", uploadedAt: "1 week ago", category: "Music" },
  { id: "s4", title: "Gourmet Pasta Making - Italian Chef Secrets", thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=640&q=80", channel: "ChefMarco", channelUserId: "", views: 567000, duration: "12:30", uploadedAt: "3 days ago", category: "Cooking" },
  { id: "s5", title: "Understanding Quantum Computing Simply", thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&q=80", channel: "ScienceHub", channelUserId: "", views: 340000, duration: "22:18", uploadedAt: "1 day ago", category: "Education" },
  { id: "s6", title: "Street Photography Tips for Beginners", thumbnail: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=640&q=80", channel: "LensLife", channelUserId: "", views: 156000, duration: "15:45", uploadedAt: "4 days ago", category: "Entertainment" },
  { id: "s7", title: "Full Body HIIT Workout - No Equipment", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640&q=80", channel: "FitZone", channelUserId: "", views: 890000, duration: "30:00", uploadedAt: "6 days ago", category: "Fitness" },
  { id: "s8", title: "Top 10 Hidden Gems in Southeast Asia", thumbnail: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=640&q=80", channel: "Wanderlust", channelUserId: "", views: 432000, duration: "19:55", uploadedAt: "1 week ago", category: "Travel" },
];

const Index = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setVideos(data);
        const userIds = [...new Set(data.map((v: any) => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        if (profilesData) {
          const map: Record<string, any> = {};
          profilesData.forEach((p: any) => { map[p.user_id] = p; });
          setProfiles(map);
        }
      }
    };
    fetchVideos();
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const allVideos = videos.length > 0
    ? videos.map((v) => {
        const p = profiles[v.user_id];
        return {
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=640&q=80",
          channel: p?.display_name || p?.username || "Unknown",
          channelUserId: v.user_id,
          views: v.views,
          duration: formatDuration(v.duration || 0),
          uploadedAt: new Date(v.created_at).toLocaleDateString(),
          category: v.category || "General",
        };
      })
    : sampleVideos;

  const displayVideos = selectedCategory === "All"
    ? allVideos
    : allVideos.filter((v) => v.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
        <CategoryChips onCategoryChange={setSelectedCategory} />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {displayVideos.length > 0 ? (
            displayVideos.map((video) => (
              <VideoCard
                key={video.id}
                {...video}
                onVideoClick={() => !video.id.startsWith("s") && navigate(`/watch/${video.id}`)}
                onProfileClick={() => video.channelUserId && navigate(`/profile/${video.channelUserId}`)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p>No videos found in this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
