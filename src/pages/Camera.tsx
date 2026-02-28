import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera as CameraIcon, SwitchCamera, Check, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { toast } from "sonner";

const Camera = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.9));

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  const acceptPhoto = async () => {
    if (!photo || !user) return;

    setAnalyzing(true);
    try {
      // Fetch user preferences for CSV data
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("interests, learning_goals, experience_level")
        .eq("user_id", user.id)
        .single();

      // Send photo + preferences to edge function
      const { data, error: fnError } = await supabase.functions.invoke("analyze-user", {
        body: {
          photo_base64: photo,
          preferences: prefs || null,
        },
      });

      if (fnError) throw fnError;

      const { estimated_age, is_kid, confidence } = data;

      toast.success(`Analysis complete! Estimated age: ${estimated_age} (${confidence} confidence)`);

      if (is_kid) {
        navigate("/kids");
      } else {
        navigate("/home");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error("Analysis failed. Redirecting to home.");
      navigate("/home");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground mb-4">
          Take a Photo
        </h1>

        <div className="relative w-full max-w-lg aspect-[4/3] bg-muted rounded-2xl overflow-hidden shadow-elevated">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : photo ? (
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {analyzing && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Analyzing photo...</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-6">
          {photo ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={retake}
                disabled={analyzing}
                className="gap-2"
              >
                <RotateCcw className="h-5 w-5" /> Retake
              </Button>
              <Button
                size="lg"
                onClick={acceptPhoto}
                disabled={analyzing}
                className="gap-2 gradient-primary text-primary-foreground border-0"
              >
                {analyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</>
                ) : (
                  <><Check className="h-5 w-5" /> Accept</>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCamera}
                className="h-12 w-12 rounded-full"
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>
              <button
                onClick={takePhoto}
                className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="h-12 w-12 rounded-full gradient-primary" />
              </button>
              <div className="h-12 w-12" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;
