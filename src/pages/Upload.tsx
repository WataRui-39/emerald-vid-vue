import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, Film, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/Header";

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (file: File | null) => {
    setVideoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      setVideoUrl(null);
      setThumbnailDataUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDuration(video.duration);
    // Capture first frame as default thumbnail
    video.currentTime = 0;
  };

  const handleSeeked = () => {
    captureFrame();
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setThumbnailDataUrl(canvas.toDataURL("image/jpeg", 0.85));
  };

  const handleSliderChange = (value: number[]) => {
    const time = value[0];
    setThumbnailTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !user) return;

    setUploading(true);
    setProgress(10);

    try {
      const fileExt = videoFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      setProgress(20);
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;
      setProgress(50);

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath);

      // Upload thumbnail if captured
      let thumbnailUrl: string | null = null;
      if (thumbnailDataUrl) {
        const blob = await (await fetch(thumbnailDataUrl)).blob();
        const thumbPath = `${user.id}/${Date.now()}_thumb.jpg`;
        const { error: thumbError } = await supabase.storage
          .from("videos")
          .upload(thumbPath, blob, { contentType: "image/jpeg" });
        if (!thumbError) {
          const { data: thumbUrl } = supabase.storage.from("videos").getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrl.publicUrl;
        }
      }
      setProgress(70);

      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title,
        description,
        video_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        category,
        duration: Math.round(videoDuration),
      });

      if (dbError) throw dbError;
      setProgress(100);

      toast.success("Video uploaded successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-foreground mb-8">Upload Video</h1>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
              videoFile ? "border-primary bg-accent/30" : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {videoFile ? (
              <div className="flex items-center justify-center gap-3">
                <Film className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(videoFile.size / 1_000_000).toFixed(1)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <UploadIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Drop your video here or click to browse</p>
              </>
            )}
          </div>

          {/* Thumbnail picker */}
          {videoUrl && (
            <div className="space-y-3 rounded-2xl border border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-primary" />
                <Label className="text-foreground font-semibold">Choose Thumbnail</Label>
              </div>

              {/* Hidden video for frame capture */}
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                onSeeked={handleSeeked}
                className="hidden"
                muted
                preload="metadata"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Thumbnail preview */}
              {thumbnailDataUrl && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img
                    src={thumbnailDataUrl}
                    alt="Selected thumbnail"
                    className="w-full aspect-video object-cover"
                  />
                </div>
              )}

              {/* Slider */}
              {videoDuration > 0 && (
                <div className="space-y-1">
                  <Slider
                    value={[thumbnailTime]}
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    onValueChange={handleSliderChange}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(thumbnailTime)}</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" required className="bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your video..." className="bg-muted/50" rows={4} />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-muted/50 px-3 text-sm"
            >
              {["General", "Music", "Gaming", "Education", "Sports", "News", "Entertainment", "Technology", "Cooking", "Travel", "Fitness"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {uploading && (
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}

          <Button type="submit" disabled={uploading || !videoFile} className="w-full gradient-primary text-primary-foreground border-0 h-11">
            {uploading ? `Uploading... ${progress}%` : "Upload Video"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
