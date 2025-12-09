import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SYSTEM_FIELDS = [
  { key: "bookingRef", label: "Booking Reference", required: true },
  { key: "guestName", label: "Guest Name", required: false },
  { key: "guestCountry", label: "Guest Country", required: false },
  { key: "checkInDate", label: "Arrival Date", required: true },
  { key: "checkOutDate", label: "Departure Date", required: true },
  { key: "bookingDate", label: "Date Booked", required: false },
  { key: "roomCategory", label: "Room Type", required: false },
  { key: "roomNum", label: "Room Number", required: false },
  { key: "adults", label: "Number of Adults", required: false },
  { key: "children", label: "Number of Children", required: false },
  { key: "totalAmount", label: "Total Price", required: true },
  { key: "adr", label: "Price Per Night", required: false },
  { key: "depositType", label: "Payment Type", required: false },
  { key: "channel", label: "Where Booking Came From", required: true },
  { key: "marketSegment", label: "Guest Type", required: false },
  { key: "bookingStatus", label: "Booking Status", required: true },
  { key: "leadTime", label: "Days Booked in Advance", required: false },
  { key: "lengthOfStay", label: "Number of Nights", required: false },
  { key: "isRepeatedGuest", label: "Returning Guest", required: false },
  { key: "previousBookings", label: "Past Stays", required: false },
];

interface DataMapperProps {
  headers: string[];
  file: File;
  fileName: string;
  onComplete: () => void;
  onCancel: () => void;
  onMappingSubmit: (columnMapping: Record<string, string>) => Promise<void>;
}

export function DataMapper({ headers, file, fileName, onComplete, onCancel, onMappingSubmit }: DataMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const autoMap: Record<string, string> = {};
    
    SYSTEM_FIELDS.forEach(field => {
      const match = headers.find(header => 
        header.toLowerCase().replace(/_/g, '').includes(field.key.toLowerCase())
      );
      if (match) {
        autoMap[field.key] = match;
      }
    });
    
    return autoMap;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProgress = () => {
    const required = SYSTEM_FIELDS.filter(f => f.required);
    const mapped = required.filter(f => mappings[f.key]);
    return Math.round((mapped.length / required.length) * 100);
  };

  const handleSubmit = async () => {
    if (getProgress() < 100) return;
    
    setIsSubmitting(true);
    try {
      await onMappingSubmit(mappings);
      onComplete();
    } catch (error) {
      console.error("Mapping submission failed:", error);
      alert(error instanceof Error ? error.message : "Failed to import data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoMappedCount = Object.keys(mappings).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold" data-testid="text-mapping-title">Match Your Columns</h2>
          <p className="text-muted-foreground">Tell us which columns in your file match our fields.</p>
          <p className="text-xs text-muted-foreground mt-1">File: {fileName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium mb-1">Mapping Health</p>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", getProgress() === 100 ? "bg-green-500" : "bg-amber-500")} 
              style={{ width: `${getProgress()}%` }} 
            />
          </div>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden mb-6">
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b border-border text-sm font-medium text-muted-foreground">
          <div className="col-span-5">What We Need</div>
          <div className="col-span-2 text-center"><ArrowRight className="h-4 w-4 mx-auto opacity-50" /></div>
          <div className="col-span-5">Your Column Name</div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
          {SYSTEM_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-12 gap-4 items-center group">
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", field.required ? "text-foreground" : "text-muted-foreground")}>
                    {field.label}
                  </span>
                  {field.required && <span className="text-xs text-red-500">*</span>}
                  {mappings[field.key] && <Check className="h-3 w-3 text-green-500 ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {field.key === 'totalAmount' ? 'e.g. 1250.00' : field.key === 'checkInDate' ? 'e.g. 2024-12-01' : 'Text'}
                </p>
              </div>
              
              <div className="col-span-2 flex justify-center">
                <div className="w-full h-[1px] bg-border group-hover:bg-primary/50 transition-colors mt-3" />
              </div>

              <div className="col-span-5">
                <Select 
                  value={mappings[field.key]} 
                  onValueChange={(val) => setMappings(prev => ({ ...prev, [field.key]: val }))}
                  data-testid={`select-mapping-${field.key}`}
                >
                  <SelectTrigger className={cn(
                    "w-full transition-all",
                    mappings[field.key] 
                      ? "border-primary/50 bg-primary/5 text-foreground" 
                      : field.required ? "border-red-200 bg-red-50/10" : "border-border"
                  )}>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {autoMappedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <div className="text-sm">
              <p className="font-medium text-blue-600 dark:text-blue-400">Smart Mapping Active</p>
              <p className="text-muted-foreground">We automatically matched {autoMappedCount} columns based on your header row.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} data-testid="button-cancel-mapping">
          Back
        </Button>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white min-w-[150px]"
          onClick={handleSubmit}
          disabled={getProgress() < 100 || isSubmitting}
          data-testid="button-import-data"
        >
          {isSubmitting ? "Importing..." : getProgress() < 100 ? "Map Required Fields" : "Import Data"}
        </Button>
      </div>
    </div>
  );
}
