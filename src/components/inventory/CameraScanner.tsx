import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CameraScanner({ active = true, onRead }: { active?: boolean; onRead: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onRead);
  callback.current = onRead;
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let delivered = false;
    let stream: MediaStream | undefined;
    let controls: { stop: () => void } | undefined;
    const stop = () => {
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
    setStatus("starting");
    setError("");
    const start = async () => {
      try {
        if (!window.isSecureContext) throw new Error("Camera scanning needs a secure HTTPS connection.");
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot access a camera. Enter the code below instead.");
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (cancelled || !video.current) { stop(); return; }
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromStream(stream, video.current, (result, _error, scannerControls) => {
          if (cancelled || delivered || !result) return;
          const code = result.getText().trim();
          if (!code) return;
          delivered = true;
          scannerControls.stop();
          stop();
          callback.current(code);
        });
        if (cancelled || delivered) { stop(); return; }
        setStatus("scanning");
      } catch (e) {
        stop();
        if (cancelled) return;
        const name = e instanceof Error ? e.name : "";
        setError(name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser, then retry."
          : name === "NotFoundError" ? "No camera was found. Connect a camera or enter the code below."
          : name === "NotReadableError" ? "Your camera is busy. Close other apps using it, then retry."
          : e instanceof Error ? e.message : "The camera could not start. Try again or enter the code below.");
        setStatus("error");
      }
    };
    void start();
    return () => { cancelled = true; stop(); };
  }, [active, attempt]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        <video ref={video} muted playsInline autoPlay className="h-full w-full object-cover" aria-label="Live camera preview" />
        {active && status === "scanning" && <div className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-primary" />}
        {status !== "scanning" && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          {status === "starting" ? <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
          <p className="text-sm" role="status">{status === "starting" ? "Starting camera…" : error}</p>
        </div>}
      </div>
      {status === "error" && <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}><RefreshCw className="h-4 w-4" /> Retry camera</Button>}
      <form className="space-y-1.5" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) callback.current(manual.trim()); }}>
        <Label htmlFor="manual-scan-code">Barcode / QR value</Label>
        <div className="flex gap-2">
          <Input id="manual-scan-code" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Enter code" className="min-w-0 font-mono" />
          <Button type="submit" variant="outline" disabled={!manual.trim()}>Use code</Button>
        </div>
      </form>
    </div>
  );
}