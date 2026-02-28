import { useRef, useState, useCallback } from "react";
import { Play, Eye } from "lucide-react";

interface VideoCardProps {
  title: string;
  thumbnail: string;
  channel: string;
  channelUserId?: string;
  views: number;
  duration: string;
  uploadedAt: string;
  videoUrl?: string;
  onVideoClick?: () => void;
  onProfileClick?: () => void;
}

const VideoCard = ({ title, thumbnail, channel, views, duration, uploadedAt, videoUrl, onVideoClick, onProfileClick }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const formatViews = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  };

  const handleMouseEnter = useCallback(() => {
    if (!videoUrl) return;
    hoverTimeout.current = setTimeout(() => {
      setShowPreview(true);
      videoRef.current?.play().catch(() => {});
    }, 500);
  }, [videoUrl]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowPreview(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <div className="group cursor-pointer">
      <div
        className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-card"
        onClick={onVideoClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={thumbnail}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${showPreview ? "opacity-0" : "opacity-100"}`}
        />
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <div className={`absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center ${showPreview ? "opacity-0" : ""}`}>
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-elevated">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
        {duration && duration !== "0:00" && (
          <span className={`absolute bottom-2 right-2 bg-foreground/80 text-background text-xs font-medium px-1.5 py-0.5 rounded-md transition-opacity ${showPreview ? "opacity-0" : ""}`}>
            {duration}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-3">
        <div
          className="w-9 h-9 rounded-full gradient-secondary shrink-0 flex items-center justify-center hover:ring-2 hover:ring-primary transition-all"
          onClick={(e) => { e.stopPropagation(); onProfileClick?.(); }}
        >
          <span className="text-secondary-foreground text-xs font-bold">{channel[0]}</span>
        </div>
        <div className="flex-1 min-w-0" onClick={onVideoClick}>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{channel}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Eye className="h-3 w-3" />
            <span>{formatViews(views)} views</span>
            <span>•</span>
            <span>{uploadedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
