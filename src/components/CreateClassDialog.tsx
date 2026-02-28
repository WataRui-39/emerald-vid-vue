import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateClassDialogProps {
  userId: string;
  onCreated: () => void;
}

const CreateClassDialog = ({ userId, onCreated }: CreateClassDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      const { error } = await supabase.from("classes" as any).insert({
        creator_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        price: parseFloat(price) || 0,
      } as any);

      if (error) throw error;

      toast.success("Class created!");
      setTitle("");
      setDescription("");
      setCategory("General");
      setPrice("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground border-0 gap-2">
          <Plus className="h-4 w-4" /> Create Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">Create 1-on-1 Tutoring Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Class Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Piano Lessons for Beginners" required className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what students will learn..." className="bg-muted/50" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground">
              {["General", "Music", "Gaming", "Education", "Sports", "Technology", "Cooking", "Fitness", "Art", "Language"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Price (USD)</Label>
            <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00 for free" className="bg-muted/50" />
          </div>
          <Button type="submit" disabled={creating || !title.trim()} className="w-full gradient-primary text-primary-foreground border-0">
            {creating ? "Creating..." : "Create Class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassDialog;
