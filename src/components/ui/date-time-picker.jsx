import * as React from "react";
//import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp } from "lucide-react";
// Assuming you have a Shadcn Calendar component (Placeholder for simplicity, usually from 'react-day-picker')
// We will mock the Calendar component imports and use the standard components.

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Time Picker Sub-Component ---
const TimePicker = React.forwardRef(({ date, setDate, className, ...props }, ref) => {
  const safeDate = date || new Date();
  let hours = safeDate.getHours();
  let minutes = safeDate.getMinutes();
  
  // Convert 24-hour time to 12-hour format
  const isPM = hours >= 12;
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  const handleTimeChange = (type, value) => {
    const newDate = new Date(safeDate.getTime());
    let h = newDate.getHours();
    let m = newDate.getMinutes();

    if (type === 'hour') {
      let newDisplayHour = Number(value);
      if (isPM) {
        h = (newDisplayHour === 12 ? 12 : newDisplayHour) + 12;
        // Fix 12 PM being 24, should be 12
        if (newDisplayHour === 12) h = 12;
        if (newDisplayHour === 12 && !isPM) h = 0; // Should not happen in 12hr selector
      } else {
         h = newDisplayHour % 12;
      }
    } else if (type === 'minute') {
      m = Number(value);
    } else if (type === 'ampm') {
      if (value === 'PM' && h < 12) {
        h += 12;
      } else if (value === 'AM' && h >= 12) {
        h -= 12;
      }
    }

    newDate.setHours(h);
    newDate.setMinutes(m);
    setDate(newDate);
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2 p-2 rounded-md bg-gray-50", className)} ref={ref} {...props}>
      <Clock className="h-4 w-4 text-gray-500" />
      <Select 
        value={String(displayHour).padStart(2, '0')} 
        onValueChange={(val) => handleTimeChange('hour', val)}
      >
        <SelectTrigger className="w-[60px] h-8 text-base">
          <SelectValue placeholder="Hr" />
        </SelectTrigger>
        <SelectContent>
          {[...Array(12).keys()].map(i => {
            const h = (i + 1);
            return <SelectItem key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</SelectItem>
          })}
        </SelectContent>
      </Select>
      :
      <Select 
        value={String(minutes).padStart(2, '0')} 
        onValueChange={(val) => handleTimeChange('minute', val)}
      >
        <SelectTrigger className="w-[60px] h-8 text-base">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {[...Array(12).keys()].map(i => { // 0, 5, 10, ...
            const m = i * 5;
            return <SelectItem key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</SelectItem>
          })}
        </SelectContent>
      </Select>
      
      <Select 
        value={isPM ? 'PM' : 'AM'} 
        onValueChange={(val) => handleTimeChange('ampm', val)}
      >
        <SelectTrigger className="w-[60px] h-8 text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});
TimePicker.displayName = "TimePicker";

// --- Fallback/Mock Calendar Component (Since we don't have the original source) ---
// In a real project, this would be imported from your Shadcn Calendar wrapper.
const Calendar = ({ mode, selected, onSelect, initialFocus }) => {
  // Simple mock implementation - replace this with your actual imported Calendar component
  return (
    <div className="p-3">
        <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <button className="text-gray-500 hover:text-gray-900"><ChevronLeft/></button>
            <span>{selected ? format(selected, "PPP") : "Select Date"} (MOCK)</span>
            <button className="text-gray-500 hover:text-gray-900"><ChevronRight/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-gray-400">{d}</span>)}
            {/* Mock days */}
            {[...Array(5)].map((_, i) => <div key={i} className="p-2"/>)}
            {[20, 21, 22, 23, 24, 25, 26].map(d => (
                <button 
                    key={d} 
                    onClick={() => onSelect(new Date(2025, 10, d))}
                    className={`p-2 rounded-full hover:bg-gray-100 ${selected && selected.getDate() === d ? 'bg-black text-white hover:bg-black/80' : ''}`}
                >
                    {d}
                </button>
            ))}
        </div>
    </div>
  );
};


// --- Main Date & Time Picker Component ---
export function DateTimePicker({ date, setDate }) {
  const [open, setOpen] = React.useState(false);
  
  const handleSelectDate = (newDay) => {
    // Preserve current time if a day is selected
    if (date) {
      newDay.setHours(date.getHours());
      newDay.setMinutes(date.getMinutes());
    } else {
      // Default to current time if no previous date was set
      newDay.setHours(new Date().getHours());
      newDay.setMinutes(new Date().getMinutes());
    }
    setDate(newDay);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-4",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP, hh:mm a") : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 rounded-xl" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate} // Use the modified handler
          initialFocus
        />
        <div className="p-3 border-t">
          {/* We ensure a Date object exists before rendering the TimePicker */}
          <TimePicker date={date || new Date()} setDate={setDate} />
        </div>
      </PopoverContent>
    </Popover>
  );
}