"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, StopCircle, Download, Monitor, Video, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RecorderPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<"idle" | "recording" | "finished">("idle");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      // Clean up previous blob URL if any
      if (videoRef.current?.src) {
          URL.revokeObjectURL(videoRef.current.src);
          videoRef.current.src = "";
          videoRef.current.controls = false;
      }
      
      setRecordedBlob(null);
      chunksRef.current = [];
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            displaySurface: "monitor",
        },
        audio: true
      });

      let combinedStream = screenStream;

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const audioContext = new AudioContext();
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        const destination = audioContext.createMediaStreamDestination();

        // Add screen audio if it exists
        if (screenStream.getAudioTracks().length > 0) {
          const screenSource = audioContext.createMediaStreamSource(new MediaStream([screenStream.getAudioTracks()[0]]));
          screenSource.connect(destination);
        }

        // Add mic audio
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);

        // Create a new stream with the screen's video and the combined audio
        combinedStream = new MediaStream([
          screenStream.getVideoTracks()[0],
          ...destination.stream.getAudioTracks()
        ]);

        // Keep a reference to tracks to stop them later
        streamRef.current = new MediaStream([
          ...screenStream.getTracks(),
          ...micStream.getTracks()
        ]);
      } catch (micErr) {
        console.warn("Microphone access denied or not available, recording screen audio only", micErr);
        streamRef.current = screenStream;
        toast.warning("Microphone not captured. Only system audio will be recorded.");
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
        videoRef.current.play();
      }

      // Detect when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          stopRecording();
        }
      };

      // Determine mime type prioritizing MP4 with AAC
      const supportedTypes = [
        "video/mp4;codecs=avc1,mp4a.40.2",
        "video/mp4;codecs=h264,aac",
        "video/mp4;codecs=h264,mp4a.40.2",
        "video/mp4;codecs=h264",
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
      ];
      
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || "video/webm";

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setStatus("finished");
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Show recorded video preview
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = URL.createObjectURL(blob);
            videoRef.current.controls = true;
            videoRef.current.play().catch(() => {}); // Autoplay might be blocked but it's fine
        }
        
        stopStream();
        toast.success("Recording saved successfully!");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("recording");
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast.info("Recording started");
    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("Could not start recording. Please ensure you granted permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    
    // Use the actual mime type to determine extension, prioritizing .mp4
    const extension = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    a.download = `recording-${timestamp}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl border-none">
        <CardHeader className="text-center border-b bg-white rounded-t-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Monitor size={24} />
            </div>
            <CardTitle className="text-2xl font-bold">Screen Recorder</CardTitle>
          </div>
          <CardDescription>
            Record your screen and audio for QA reviews or documentation.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 bg-slate-900 aspect-video flex items-center justify-center overflow-hidden relative group">
          {!isRecording && status === "idle" && (
            <div className="text-center text-slate-400 space-y-4">
              <div className="bg-slate-800 p-6 rounded-full inline-block mb-2">
                <Video size={48} className="opacity-50" />
              </div>
              <p>Preview will appear here once you start recording</p>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            className={`w-full h-full object-contain ${status === "idle" ? "hidden" : "block"}`}
            muted 
            autoPlay 
            playsInline
          />

          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1.5 px-3 py-1 text-sm">
                <Circle size={12} fill="currentColor" />
                REC
              </Badge>
              <Badge variant="secondary" className="bg-black/50 text-white border-none backdrop-blur-sm px-3 py-1 text-sm font-mono">
                {formatDuration(duration)}
              </Badge>
            </div>
          )}

          {status === "finished" && !isRecording && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-6 transition-opacity opacity-0 group-hover:opacity-100">
              <CheckCircle2 size={48} className="text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Recording Finished</h3>
              <p className="text-slate-300 mb-6">Your recording is ready to download.</p>
              <Button onClick={downloadRecording} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" /> Download Recording
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center p-6 bg-white rounded-b-xl border-t">
          <div className="flex gap-3">
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                disabled={status === "recording"}
                className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
              >
                <Monitor className="mr-2 h-4 w-4" /> {status === "finished" ? "Record Again" : "Start Recording"}
              </Button>
            ) : (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="h-11 px-6"
              >
                <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
              </Button>
            )}
            
            {status === "finished" && !isRecording && (
              <Button 
                onClick={downloadRecording} 
                variant="outline"
                className="h-11 px-6 border-green-200 text-green-700 hover:bg-green-50"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            ) }
          </div>

          <div className="text-sm text-slate-500 font-medium">
            {isRecording ? "Currently recording..." : status === "finished" ? "Ready for download" : "Ready to start"}
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 max-w-2xl text-center text-slate-400 text-sm px-6">
        <p>Tip: When you click Start Recording, you can choose to record your entire screen, a specific window (like Zoom), or a browser tab. Make sure to check "Share system audio" if you need to capture sound.</p>
      </div>
    </div>
  );
}
