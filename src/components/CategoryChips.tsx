import { useState } from "react";

const categories = [
  "All", "Music", "Gaming", "Education", "Sports", "News",
  "Entertainment", "Technology", "Cooking", "Travel", "Fitness"
];

const CategoryChips = () => {
  const [active, setActive] = useState("All");

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActive(cat)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            active === cat
              ? "gradient-primary text-primary-foreground shadow-card"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
