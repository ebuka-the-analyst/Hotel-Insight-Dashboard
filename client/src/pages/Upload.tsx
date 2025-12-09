import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { DataMapper } from "@/components/dashboard/DataMapper";
import { Upload as UploadIcon, FileSpreadsheet, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Upload() {
  const [_, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "mapping" | "success" | "error">("idle");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    startUpload();
  };

  const startUpload = () => {
    setUploadStatus("uploading");
    setTimeout(() => {
      // Transition to mapping instead of direct success
      setUploadStatus("mapping");
    }, 1500);
  };

  const handleMappingComplete = () => {
    setUploadStatus("success");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold mb-2">Data Source</h1>
          <p className="text-muted-foreground">
            Upload your hotel data (CSV, Excel, or JSON) to generate new insights.
          </p>
        </div>

        {uploadStatus === "mapping" ? (
          <DataMapper 
            onComplete={handleMappingComplete} 
            onCancel={() => setUploadStatus("idle")} 
          />
        ) : (
          <GlassCard className="p-10">
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer",
                isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/30",
                uploadStatus === "success" && "border-green-500 bg-green-500/5",
                uploadStatus === "error" && "border-red-500 bg-red-500/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (uploadStatus === "idle") {
                  startUpload();
                }
              }}
            >
              {uploadStatus === "idle" && (
                <>
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <UploadIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Drag & Drop or Click to Upload</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                    We support any Excel format. Our AI will help map your columns automatically.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      <FileSpreadsheet className="h-3 w-3" /> CSV / Excel
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      <FileJson className="h-3 w-3" /> JSON
                    </div>
                  </div>
                </>
              )}

              {uploadStatus === "uploading" && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 border-4 border-muted rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <UploadIcon className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Analyzing Headers...</h3>
                  <p className="text-sm text-muted-foreground">Detecting column structure</p>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Data Successfully Mapped</h3>
                  <p className="text-sm text-muted-foreground mb-6">Your dashboard has been updated with the new dataset.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); setUploadStatus("idle"); }}>Upload Another</Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white" onClick={(e) => { e.stopPropagation(); setLocation("/analysis"); }}>View Insights</Button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Recent Uploads - Only show when not mapping */}
        {uploadStatus !== "mapping" && (
          <div className="mt-8">
            <h3 className="text-lg font-serif font-semibold mb-4">Recent Uploads</h3>
            <div className="space-y-3">
              {[
                { name: "hotel_bookings_dec_2024.csv", size: "2.4 MB", date: "2 hours ago", status: "Mapped" },
                { name: "guest_feedback_q4.xlsx", size: "1.8 MB", date: "Yesterday", status: "Mapped" },
                { name: "revenue_forecast_2025.json", size: "450 KB", date: "3 days ago", status: "Processed" },
              ].map((file, i) => (
                <GlassCard key={i} className="py-3 px-4 flex items-center justify-between hover:bg-white/5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/30 rounded-lg">
                      {file.name.endsWith('csv') || file.name.endsWith('xlsx') ? <FileSpreadsheet className="h-5 w-5 text-green-600" /> : <FileJson className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{file.status}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
