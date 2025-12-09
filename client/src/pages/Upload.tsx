import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { DataMapper } from "@/components/dashboard/DataMapper";
import { Upload as UploadIcon, FileSpreadsheet, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { uploadFile, createDataset, getDatasets } from "@/lib/api-client";

export default function Upload() {
  const [_, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "mapping" | "success" | "error">("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: datasets, refetch: refetchDatasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: getDatasets,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setDetectedHeaders(data.headers);
      setUploadStatus("mapping");
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setUploadStatus("error");
    },
  });

  const createDatasetMutation = useMutation({
    mutationFn: createDataset,
    onSuccess: () => {
      refetchDatasets();
      setUploadStatus("success");
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create dataset");
      setUploadStatus("error");
    },
  });

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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/json'
    ];
    
    const isValidType = validTypes.includes(file.type) || 
                        file.name.endsWith('.csv') || 
                        file.name.endsWith('.xlsx') || 
                        file.name.endsWith('.xls') ||
                        file.name.endsWith('.json');
    
    if (!isValidType) {
      setErrorMessage("Please upload a valid CSV, Excel, or JSON file");
      setUploadStatus("error");
      return;
    }

    setUploadedFile(file);
    setUploadStatus("uploading");
    setErrorMessage("");
    uploadMutation.mutate(file);
  };

  const handleClick = () => {
    if (uploadStatus === "idle") {
      fileInputRef.current?.click();
    }
  };

  const handleMappingComplete = () => {
    setUploadStatus("success");
  };

  const handleMappingSubmit = async (columnMapping: Record<string, string>) => {
    if (!uploadedFile) {
      throw new Error("No file uploaded");
    }

    await createDatasetMutation.mutateAsync({
      file: uploadedFile,
      name: uploadedFile.name,
      columnMapping,
    });
  };

  const handleReset = () => {
    setUploadStatus("idle");
    setUploadedFile(null);
    setDetectedHeaders([]);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-upload-title">Data Source</h1>
          <p className="text-muted-foreground">
            Upload your hotel data (CSV, Excel, or JSON) to generate new insights.
          </p>
        </div>

        {uploadStatus === "mapping" && uploadedFile ? (
          <DataMapper 
            headers={detectedHeaders}
            file={uploadedFile}
            fileName={uploadedFile.name}
            onComplete={handleMappingComplete} 
            onCancel={handleReset}
            onMappingSubmit={handleMappingSubmit}
          />
        ) : (
          <GlassCard className="p-10">
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.xls,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              data-testid="input-file-upload"
            />
            
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
              onClick={handleClick}
              data-testid="dropzone-upload"
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

              {uploadStatus === "error" && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-red-500">Upload Failed</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center">{errorMessage}</p>
                  <Button variant="outline" onClick={handleReset} data-testid="button-try-again">
                    Try Again
                  </Button>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" data-testid="text-success-message">Data Successfully Mapped</h3>
                  <p className="text-sm text-muted-foreground mb-6">Your dashboard has been updated with the new dataset.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleReset(); }} data-testid="button-upload-another">
                      Upload Another
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white" onClick={(e) => { e.stopPropagation(); setLocation("/dashboard"); }} data-testid="button-view-insights">
                      View Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {uploadStatus !== "mapping" && datasets && datasets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-serif font-semibold mb-4">Recent Uploads</h3>
            <div className="space-y-3">
              {datasets.slice(0, 3).map((dataset) => (
                <GlassCard key={dataset.id} className="py-3 px-4 flex items-center justify-between hover:bg-white/5 cursor-pointer" data-testid={`card-dataset-${dataset.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm" data-testid={`text-dataset-name-${dataset.id}`}>{dataset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dataset.uploadedAt).toLocaleDateString()} • {dataset.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      dataset.status === "processed" ? "text-green-500 bg-green-500/10" : "text-amber-500 bg-amber-500/10"
                    )}>
                      {dataset.status}
                    </span>
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
