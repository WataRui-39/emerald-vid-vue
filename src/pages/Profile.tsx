import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload as UploadIcon, Film, Heart, Users, Video, ImageIcon, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import CreateClassDialog from "@/components/CreateClassDialog";
import ClassCard from "@/components/ClassCard";

const Profile = () => {
  const { user, loading } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [subscribedVideos, setSubscribedVideos] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);

  // Upload state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Determine which user's profile to show
  const viewingUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (viewingUserId) {
      fetchProfile();
      fetchUserVideos();
      fetchMyClasses();
      if (isOwnProfile) {
        fetchLikedVideos();
        fetchSubscribedVideos();
        fetchEnrolledClasses();
      }
    }
  }, [user, loading, viewingUserId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", viewingUserId!)
      .single();
    setProfile(data);
  };

  const fetchUserVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", viewingUserId!)
      .order("created_at", { ascending: false });
    setMyVideos(data || []);
  };

  const fetchLikedVideos = async () => {
    const { data } = await supabase
      .from("likes")
      .select("video_id, videos(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setLikedVideos(data?.map((l: any) => l.videos).filter(Boolean) || []);
  };

  const fetchSubscribedVideos = async () => {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("channel_id")
      .eq("subscriber_id", user!.id);

    if (subs && subs.length > 0) {
      const channelIds = subs.map((s: any) => s.channel_id);
      const { data: videos } = await supabase
        .from("videos")
        .select("*")
        .in("user_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(20);
      setSubscribedVideos(videos || []);
    }
  };

  const fetchMyClasses = async () => {
    const { data } = await supabase
      .from("classes" as any)
      .select("*")
      .eq("creator_id", viewingUserId!)
      .order("created_at", { ascending: false });
    
    if (data) {
      // Fetch video counts and student counts for each class
      const enriched = await Promise.all(
        (data as any[]).map(async (cls: any) => {
          const { count: videoCount } = await supabase
            .from("class_videos" as any)
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);
          const { count: studentCount } = await supabase
            .from("class_enrollments" as any)
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);
          return { ...cls, videoCount: videoCount || 0, studentCount: studentCount || 0 };
        })
      );
      setMyClasses(enriched);
    }
  };

  const fetchEnrolledClasses = async () => {
    if (!user) return;
    const { data: enrollments } = await supabase
      .from("class_enrollments" as any)
      .select("class_id")
      .eq("student_id", user.id);
    
    if (enrollments && enrollments.length > 0) {
      const classIds = (enrollments as any[]).map((e: any) => e.class_id);
      const { data: classes } = await supabase
        .from("classes" as any)
        .select("*")
        .in("id", classIds);
      
      if (classes) {
        const enriched = await Promise.all(
          (classes as any[]).map(async (cls: any) => {
            const { count: videoCount } = await supabase
              .from("class_videos" as any)
              .select("*", { count: "exact", head: true })
              .eq("class_id", cls.id);
            // Fetch creator name
            const { data: creatorProfile } = await supabase
              .from("profiles")
              .select("display_name, username")
              .eq("user_id", cls.creator_id)
              .single();
            return {
              ...cls,
              videoCount: videoCount || 0,
              creatorName: creatorProfile?.display_name || creatorProfile?.username || "Tutor",
            };
          })
        );
        setEnrolledClasses(enriched);
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(null);
    }
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

      // Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split(".").pop();
        const thumbPath = `${user.id}/thumbs/${Date.now()}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from("videos")
          .upload(thumbPath, thumbnailFile);
        if (thumbError) throw thumbError;
        const { data: thumbUrlData } = supabase.storage.from("videos").getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }

      setProgress(70);

      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title,
        description,
        video_url: urlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        category,
      });

      if (dbError) throw dbError;
      setProgress(100);

      toast.success("Video uploaded successfully!");
      setTitle("");
      setDescription("");
      setCategory("General");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setProgress(0);
      fetchUserVideos();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatVideo = (v: any) => ({
    title: v.title,
    thumbnail: v.thumbnail_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=640&q=80",
    channel: profile?.display_name || profile?.username || "User",
    views: v.views,
    duration: `${Math.floor((v.duration || 0) / 60)}:${String((v.duration || 0) % 60).padStart(2, "0")}`,
    uploadedAt: new Date(v.created_at).toLocaleDateString(),
  });

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-elevated">
            <span className="text-primary-foreground text-3xl font-bold font-['Space_Grotesk']">
              {(profile?.display_name || profile?.username || "U")[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">
              {profile?.display_name || profile?.username || "User"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {myVideos.length} videos uploaded
            </p>
          </div>
        </div>

        <Tabs defaultValue="uploads" className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="uploads" className="gap-2">
              <Video className="h-4 w-4" /> {isOwnProfile ? "My Videos" : "Videos"}
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <BookOpen className="h-4 w-4" /> {isOwnProfile ? "My Classes" : "Classes"}
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="enrolled" className="gap-2">
                  <GraduationCap className="h-4 w-4" /> Enrolled
                </TabsTrigger>
                <TabsTrigger value="liked" className="gap-2">
                  <Heart className="h-4 w-4" /> Liked
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="gap-2">
                  <Users className="h-4 w-4" /> Subscriptions
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <UploadIcon className="h-4 w-4" /> Upload
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="uploads">
            {myVideos.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isOwnProfile ? "You haven't uploaded any videos yet." : "No videos uploaded yet."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                {myVideos.map((v) => (
                  <VideoCard key={v.id} {...formatVideo(v)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Classes tab - visible to everyone */}
          <TabsContent value="classes">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold font-['Space_Grotesk'] text-foreground">
                {isOwnProfile ? "My Tutoring Classes" : "Tutoring Classes"}
              </h2>
              {isOwnProfile && user && (
                <CreateClassDialog userId={user.id} onCreated={fetchMyClasses} />
              )}
            </div>
            {myClasses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isOwnProfile ? "You haven't created any classes yet." : "No classes yet."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myClasses.map((cls: any) => (
                  <ClassCard
                    key={cls.id}
                    title={cls.title}
                    description={cls.description}
                    category={cls.category}
                    price={Number(cls.price)}
                    videoCount={cls.videoCount}
                    studentCount={cls.studentCount}
                    availableDates={cls.available_dates}
                    isOwnClass={isOwnProfile}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <>
              {/* Enrolled classes tab */}
              <TabsContent value="enrolled">
                {enrolledClasses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>You haven't enrolled in any classes yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrolledClasses.map((cls: any) => (
                      <ClassCard
                        key={cls.id}
                        title={cls.title}
                        description={cls.description}
                        category={cls.category}
                        price={Number(cls.price)}
                        videoCount={cls.videoCount}
                        studentCount={0}
                        creatorName={cls.creatorName}
                        availableDates={cls.available_dates}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="liked">
                {likedVideos.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No liked videos yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                    {likedVideos.map((v) => (
                      <VideoCard key={v.id} {...formatVideo(v)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="subscriptions">
                {subscribedVideos.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No subscriptions yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                    {subscribedVideos.map((v) => (
                      <VideoCard key={v.id} {...formatVideo(v)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload">
                <div className="max-w-2xl">
                  <form onSubmit={handleUpload} className="space-y-6">
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

                    {/* Thumbnail upload */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Thumbnail Image</Label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                          thumbnailFile ? "border-primary bg-accent/30" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {thumbnailPreview ? (
                          <div className="flex items-center gap-4">
                            <img src={thumbnailPreview} alt="Thumbnail preview" className="h-20 w-36 object-cover rounded-lg" />
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{thumbnailFile?.name}</p>
                              <p className="text-xs text-muted-foreground">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Upload a thumbnail image</p>
                          </div>
                        )}
                      </div>
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
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
