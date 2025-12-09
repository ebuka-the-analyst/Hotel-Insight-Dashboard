import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export type DatePreset = 
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "lastYear"
  | "allTime"
  | "custom";

export interface DateRangeValue {
  startDate: Date;
  endDate: Date;
  preset: DatePreset;
}

const presetLabels: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
  thisWeek: "This Week",
  lastWeek: "Last Week",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  thisQuarter: "This Quarter",
  lastQuarter: "Last Quarter",
  thisYear: "This Year",
  lastYear: "Last Year",
  allTime: "All Time",
  custom: "Custom Range",
};

function getPresetDates(preset: DatePreset): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = startOfDay(now);
  
  switch (preset) {
    case "today":
      return { startDate: today, endDate: endOfDay(now) };
    case "yesterday":
      return { startDate: startOfDay(subDays(now, 1)), endDate: endOfDay(subDays(now, 1)) };
    case "last7days":
      return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
    case "last30days":
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
    case "thisWeek":
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
    case "lastWeek":
      const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      return { startDate: lastWeekStart, endDate: endOfWeek(lastWeekStart, { weekStartsOn: 1 }) };
    case "thisMonth":
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case "lastMonth":
      const lastMonth = subMonths(now, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
    case "thisQuarter":
      return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
    case "lastQuarter":
      const lastQuarter = subMonths(now, 3);
      return { startDate: startOfQuarter(lastQuarter), endDate: endOfQuarter(lastQuarter) };
    case "thisYear":
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    case "lastYear":
      const lastYear = subYears(now, 1);
      return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };
    case "allTime":
      return { startDate: new Date(2000, 0, 1), endDate: endOfDay(now) };
    case "custom":
    default:
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
  }
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const handlePresetChange = (preset: DatePreset) => {
    if (preset === "custom") {
      setIsCalendarOpen(true);
      return;
    }
    const dates = getPresetDates(preset);
    onChange({ ...dates, preset });
  };
  
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange({
        startDate: startOfDay(range.from),
        endDate: endOfDay(range.to),
        preset: "custom",
      });
    }
  };
  
  const displayLabel = value.preset === "custom" 
    ? `${format(value.startDate, "MMM d, yyyy")} - ${format(value.endDate, "MMM d, yyyy")}`
    : presetLabels[value.preset];

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="date-range-filter">
      <Select value={value.preset} onValueChange={(val) => handlePresetChange(val as DatePreset)}>
        <SelectTrigger className="w-[180px] bg-background" data-testid="select-date-preset">
          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 Days</SelectItem>
          <SelectItem value="last30days">Last 30 Days</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="lastWeek">Last Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="thisQuarter">This Quarter</SelectItem>
          <SelectItem value="lastQuarter">Last Quarter</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
          <SelectItem value="lastYear">Last Year</SelectItem>
          <SelectItem value="allTime">All Time</SelectItem>
          <SelectItem value="custom">Custom Range...</SelectItem>
        </SelectContent>
      </Select>
      
      {value.preset === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-custom-date">
              {format(value.startDate, "MMM d")} - {format(value.endDate, "MMM d, yyyy")}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={value.startDate}
              selected={{ from: value.startDate, to: value.endDate }}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
      
      <span className="text-sm text-muted-foreground hidden md:inline" data-testid="text-date-range">
        {value.preset !== "custom" && (
          <>
            {format(value.startDate, "MMM d")} - {format(value.endDate, "MMM d, yyyy")}
          </>
        )}
      </span>
    </div>
  );
}

export function useDefaultDateRange(): DateRangeValue {
  const dates = getPresetDates("allTime");
  return { ...dates, preset: "allTime" };
}

export { getPresetDates };
