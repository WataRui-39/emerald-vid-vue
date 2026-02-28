import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, ThumbsUp, UserPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";

const Watch = () => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recProfiles, setRecProfiles] = useState<Record<string, any>>({});
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchRecommendations();
    }
  }, [videoId]);

  useEffect(() => {
    if (video && user) {
      checkLiked();
      checkSubscribed();
    }
  }, [video, user]);

  const fetchVideo = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId!)
      .single();
    if (data) {
      setVideo(data);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user_id)
        .single();
      setChannel(profile);
    }
  };

  const fetchRecommendations = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .neq("id", videoId!)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) {
      setRecommendations(data);
      const userIds = [...new Set(data.map((v: any) => v.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        if (profiles) {
          const map: Record<string, any> = {};
          profiles.forEach((p: any) => { map[p.user_id] = p; });
          setRecProfiles(map);
        }
      }
    }
  };

  const checkLiked = async () => {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user!.id)
      .eq("video_id", videoId!)
      .maybeSingle();
    setLiked(!!data);
  };

  const checkSubscribed = async () => {
    if (!video) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", user!.id)
      .eq("channel_id", video.user_id)
      .maybeSingle();
    setSubscribed(!!data);
  };

  const toggleLike = async () => {
    if (!user) { toast.error("Please log in"); return; }
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("video_id", videoId!);
      setLiked(false);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, video_id: videoId! });
      setLiked(true);
    }
  };

  const toggleSubscribe = async () => {
    if (!user || !video) { toast.error("Please log in"); return; }
    if (subscribed) {
      await supabase.from("subscriptions").delete().eq("subscriber_id", user.id).eq("channel_id", video.user_id);
      setSubscribed(false);
      toast.success("Unsubscribed");
    } else {
      await supabase.from("subscriptions").insert({ subscriber_id: user.id, channel_id: video.user_id });
      setSubscribed(true);
      toast.success("Subscribed!");
    }
  };

  const formatViews = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main video area */}
          <div className="flex-1 min-w-0">
            {/* Video player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                src={video.video_url}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>

            {/* Video info */}
            <h1 className="text-xl font-bold text-foreground mt-4 font-['Space_Grotesk']">
              {video.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              {/* Channel info */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/profile/${video.user_id}`)}
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">
                    {(channel?.display_name || channel?.username || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {channel?.display_name || channel?.username || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {formatViews(video.views)} views
                  </p>
                </div>
                {user && video.user_id !== user.id && (
                  <Button
                    variant={subscribed ? "secondary" : "default"}
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); toggleSubscribe(); }}
                    className={subscribed ? "" : "gradient-primary text-primary-foreground border-0"}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {subscribed ? "Subscribed" : "Subscribe"}
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant={liked ? "default" : "outline"}
                  size="sm"
                  onClick={toggleLike}
                  className={liked ? "gradient-primary text-primary-foreground border-0" : ""}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {liked ? "Liked" : "Like"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </div>

          {/* Recommendations sidebar */}
          <div className="lg:w-[400px] shrink-0">
            <h2 className="text-base font-semibold text-foreground mb-4">Recommended</h2>
            <div className="flex flex-col gap-3">
              {recommendations.map((rec) => {
                const p = recProfiles[rec.user_id];
                return (
                  <div
                    key={rec.id}
                    className="flex gap-3 cursor-pointer group"
                    onClick={() => navigate(`/watch/${rec.id}`)}
                  >
                    <div className="relative w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={rec.thumbnail_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=640&q=80"}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 bg-foreground/80 text-background text-[10px] font-medium px-1 py-0.5 rounded">
                        {`${Math.floor((rec.duration || 0) / 60)}:${String((rec.duration || 0) % 60).padStart(2, "0")}`}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p?.display_name || p?.username || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Eye className="h-3 w-3" /> {formatViews(rec.views)} views
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Watch;
