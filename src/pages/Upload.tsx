import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !user) return;

    setUploading(true);
    setProgress(10);

    try {
      const fileExt = videoFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      setProgress(30);
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;
      setProgress(70);

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title,
        description,
        video_url: urlData.publicUrl,
        category,
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
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
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
