import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera as CameraIcon, SwitchCamera, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

const Camera = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);

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

    // Immediately stop camera for security
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

  const acceptPhoto = () => {
    navigate("/home");
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
        </div>

        <div className="flex items-center gap-4 mt-6">
          {photo ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={retake}
                className="gap-2"
              >
                <RotateCcw className="h-5 w-5" /> Retake
              </Button>
              <Button
                size="lg"
                onClick={acceptPhoto}
                className="gap-2 gradient-primary text-primary-foreground border-0"
              >
                <Check className="h-5 w-5" /> Accept
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
              <div className="h-12 w-12" /> {/* Spacer for symmetry */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;
