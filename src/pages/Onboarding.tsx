import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const INTEREST_OPTIONS = [
  "Mathematics", "Science", "Programming", "Art & Design",
  "Music", "Languages", "History", "Photography",
  "Cooking", "Fitness", "Business", "Writing",
];

const GOAL_OPTIONS = [
  "Learn a new skill", "Share my knowledge", "Connect with others",
  "Build a portfolio", "Career development", "Just for fun",
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "Just starting out" },
  { value: "intermediate", label: "Intermediate", desc: "Some experience" },
  { value: "advanced", label: "Advanced", desc: "Very experienced" },
];

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("beginner");
  const [saving, setSaving] = useState(false);

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_preferences").insert({
        user_id: user.id,
        interests,
        learning_goals: goals,
        experience_level: experience,
      });
      if (error) throw error;
      toast.success("Preferences saved!");
      navigate("/camera");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const steps = [
    // Step 0: Interests
    <div key="interests" className="space-y-4">
      <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">
        What are you interested in?
      </h2>
      <p className="text-sm text-muted-foreground">Select all that apply</p>
      <div className="grid grid-cols-2 gap-3">
        {INTEREST_OPTIONS.map((item) => {
          const selected = interests.includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleItem(item, interests, setInterests)}
              className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-2">
                {selected && <Check className="h-4 w-4" />}
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>,

    // Step 1: Goals
    <div key="goals" className="space-y-4">
      <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">
        What are your goals?
      </h2>
      <p className="text-sm text-muted-foreground">Select all that apply</p>
      <div className="grid grid-cols-1 gap-3">
        {GOAL_OPTIONS.map((item) => {
          const selected = goals.includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleItem(item, goals, setGoals)}
              className={`p-4 rounded-xl text-sm font-medium border transition-all text-left ${
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-2">
                {selected && <Check className="h-4 w-4" />}
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2: Experience
    <div key="experience" className="space-y-4">
      <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">
        What's your experience level?
      </h2>
      <p className="text-sm text-muted-foreground">This helps us personalize your feed</p>
      <div className="grid grid-cols-1 gap-3">
        {EXPERIENCE_OPTIONS.map((opt) => {
          const selected = experience === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setExperience(opt.value)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="font-medium text-foreground">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
            </button>
          );
        })}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Sparkles className="h-10 w-10 text-primary-foreground mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-primary-foreground font-['Space_Grotesk']">
            Tell us about yourself
          </h1>
          <div className="flex gap-2 justify-center mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? "w-10 bg-primary-foreground" : "w-6 bg-primary-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-elevated">
          {steps[step]}

          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="gap-1 gradient-primary text-primary-foreground border-0"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="gap-1 gradient-primary text-primary-foreground border-0"
              >
                {saving ? "Saving..." : "Finish"} <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
