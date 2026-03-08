import { useState, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMealDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: string;
  onMealAdded: () => void;
}

const AddMealDrawer = ({ open, onOpenChange, userId, date, onMealAdded }: AddMealDrawerProps) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resizeAndConvertToBase64 = (file: File, maxSize = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!photo) {
      toast.error("Adicione uma foto da refeição");
      return;
    }

    setAnalyzing(true);

    try {
      // 1. Upload photo
      const ext = photo.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("meal-photos")
        .upload(filePath, photo, { contentType: photo.type });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(filePath);

      // 2. Analyze with AI
      const base64 = await resizeAndConvertToBase64(photo);
      const { data: analysis, error: fnErr } = await supabase.functions.invoke("analyze-meal", {
        body: { imageBase64: base64, description },
      });

      if (fnErr) throw fnErr;

      // 3. Save meal log
      const { error: insertErr } = await supabase.from("meal_logs").insert({
        user_id: userId,
        date,
        meal_time: new Date().toISOString(),
        photo_url: urlData.publicUrl,
        description: analysis?.description || description,
        calories: analysis?.total_calories || 0,
        protein: analysis?.total_protein || 0,
        fiber: analysis?.total_fiber || 0,
        ai_analysis: analysis,
      } as any);

      if (insertErr) throw insertErr;

      toast.success("Refeição registrada! 🍽️");
      onMealAdded();
      resetAndClose();
    } catch (err: any) {
      console.error("Error adding meal:", err);
      toast.error("Erro ao registrar refeição");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAndClose = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg font-bold">Registrar Refeição</DrawerTitle>
        </DrawerHeader>

        <div className="px-5 pb-8 space-y-5">
          {/* Photo area */}
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={photoPreview} alt="Meal" className="w-full h-56 object-cover" />
              <button
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 h-40 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Camera className="w-8 h-8 text-primary/60" />
                <span className="text-sm font-semibold text-primary/70">Câmera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-40 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <ImagePlus className="w-8 h-8 text-muted-foreground/60" />
                <span className="text-sm font-semibold text-muted-foreground/70">Galeria</span>
              </button>
            </div>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Optional description */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço com arroz, feijão e frango"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!photo || analyzing}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-elevated active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              "Registrar refeição"
            )}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddMealDrawer;
