import { BookOpen, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClassCardProps {
  title: string;
  description?: string | null;
  category?: string | null;
  price: number;
  videoCount: number;
  studentCount: number;
  creatorName?: string;
  onClick?: () => void;
}

const ClassCard = ({ title, description, category, price, videoCount, studentCount, creatorName, onClick }: ClassCardProps) => {
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
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {category && <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{category}</span>}
        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{videoCount} videos</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{studentCount}</span>
      </div>
    </div>
  );
};

export default ClassCard;
