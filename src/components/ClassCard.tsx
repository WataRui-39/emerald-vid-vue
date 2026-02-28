import { useState } from "react";
import { BookOpen, Users, DollarSign, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  title: string;
  description?: string | null;
  category?: string | null;
  price: number;
  videoCount: number;
  studentCount: number;
  creatorName?: string;
  availableDates?: string[];
  isOwnClass?: boolean;
  onEnroll?: (date: string) => void;
  onClick?: () => void;
}

const ClassCard = ({ title, description, category, price, videoCount, studentCount, creatorName, availableDates, isOwnClass, onEnroll, onClick }: ClassCardProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const availableDateObjects = (availableDates || [])
    .map((d) => {
      try { return parseISO(d); } catch { return null; }
    })
    .filter((d): d is Date => d !== null && d >= new Date(new Date().setHours(0, 0, 0, 0)));

  const isDateAvailable = (date: Date) =>
    availableDateObjects.some((d) => d.toDateString() === date.toDateString());

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        {price > 0 ? (
          <Badge className="gradient-secondary text-secondary-foreground border-0 gap-1">
            <DollarSign className="h-3 w-3" />{price.toFixed(2)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">Free</Badge>
        )}
      </div>
      <h3 className="font-semibold font-['Space_Grotesk'] text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
      )}
      {creatorName && (
        <p className="text-xs text-muted-foreground mb-2">by {creatorName}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {category && <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{category}</span>}
        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{videoCount} videos</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{studentCount}</span>
      </div>

      {/* Available dates section */}
      {availableDateObjects.length > 0 && (
        <div className="mt-2 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <CalendarIcon className="h-3 w-3" />
            <span>{availableDateObjects.length} date{availableDateObjects.length > 1 ? "s" : ""} available</span>
          </div>

          {isOwnClass ? (
            <div className="flex flex-wrap gap-1">
              {availableDateObjects.slice(0, 3).map((d) => (
                <Badge key={d.toISOString()} variant="outline" className="text-xs">
                  {format(d, "MMM d")}
                </Badge>
              ))}
              {availableDateObjects.length > 3 && (
                <Badge variant="outline" className="text-xs">+{availableDateObjects.length - 3} more</Badge>
              )}
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date to enroll"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date && isDateAvailable(date)) {
                      setSelectedDate(date);
                    }
                  }}
                  disabled={(date) => !isDateAvailable(date)}
                  className={cn("p-3 pointer-events-auto")}
                />
                {selectedDate && onEnroll && (
                  <div className="p-3 pt-0">
                    <Button
                      size="sm"
                      className="w-full gradient-primary text-primary-foreground border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnroll(format(selectedDate, "yyyy-MM-dd"));
                      }}
                    >
                      Enroll for {format(selectedDate, "MMM d, yyyy")}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassCard;
