import { Play, Eye } from "lucide-react";

interface VideoCardProps {
  title: string;
  thumbnail: string;
  channel: string;
  views: number;
  duration: string;
  uploadedAt: string;
}

const VideoCard = ({ title, thumbnail, channel, views, duration, uploadedAt }: VideoCardProps) => {
  const formatViews = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  };

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-card">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-elevated">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-xs font-medium px-1.5 py-0.5 rounded-md">
          {duration}
        </span>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="w-9 h-9 rounded-full gradient-secondary shrink-0 flex items-center justify-center">
          <span className="text-secondary-foreground text-xs font-bold">{channel[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
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
