import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// This would typically come from parsing the uploaded file
// Mocking headers based on standard Hotel Excel formats
const DETECTED_HEADERS = [
  "Booking_Ref",
  "Guest_Name",
  "Check_In_Date",
  "Check_Out_Date",
  "Room_Category",
  "Room_Num",
  "Rate_Plan",
  "Total_Amount",
  "Booking_Status",
  "Channel"
];

const SYSTEM_FIELDS = [
  { key: "id", label: "Booking ID", required: true },
  { key: "guest", label: "Guest Name", required: false },
  { key: "arrival", label: "Arrival Date", required: true },
  { key: "departure", label: "Departure Date", required: true },
  { key: "room_type", label: "Room Type", required: false },
  { key: "revenue", label: "Total Revenue", required: true },
  { key: "status", label: "Status", required: true },
];

interface DataMapperProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function DataMapper({ onComplete, onCancel }: DataMapperProps) {
  // Auto-map logic (mocked)
  const [mappings, setMappings] = useState<Record<string, string>>({
    id: "Booking_Ref",
    guest: "Guest_Name",
    arrival: "Check_In_Date",
    departure: "Check_Out_Date",
    revenue: "Total_Amount",
    status: "Booking_Status"
  });

  const getProgress = () => {
    const required = SYSTEM_FIELDS.filter(f => f.required);
    const mapped = required.filter(f => mappings[f.key]);
    return Math.round((mapped.length / required.length) * 100);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Map Your Columns</h2>
          <p className="text-muted-foreground">Match your Excel headers to our analytics engine.</p>
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
          <div className="col-span-5">System Field</div>
          <div className="col-span-2 text-center"><ArrowRight className="h-4 w-4 mx-auto opacity-50" /></div>
          <div className="col-span-5">Your Excel Header</div>
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
                  e.g. {field.key === 'revenue' ? '£1,250.00' : field.key === 'arrival' ? '2024-12-01' : 'Text'}
                </p>
              </div>
              
              <div className="col-span-2 flex justify-center">
                <div className="w-full h-[1px] bg-border group-hover:bg-primary/50 transition-colors mt-3" />
              </div>

              <div className="col-span-5">
                <Select 
                  value={mappings[field.key]} 
                  onValueChange={(val) => setMappings(prev => ({ ...prev, [field.key]: val }))}
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
                    {DETECTED_HEADERS.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          <div className="text-sm">
            <p className="font-medium text-blue-600 dark:text-blue-400">Smart Mapping Active</p>
            <p className="text-muted-foreground">We automatically matched 6 columns based on your header row.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Back</Button>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white min-w-[150px]"
          onClick={onComplete}
          disabled={getProgress() < 100}
        >
          {getProgress() < 100 ? "Map Required Fields" : "Import Data"}
        </Button>
      </div>
    </div>
  );
}
