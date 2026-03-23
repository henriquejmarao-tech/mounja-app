import { useState, useRef, forwardRef, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Camera, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MealAnalysisOverlay from "./MealAnalysisOverlay";

interface AddMealDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: string;
  onMealAdded: () => void;
}

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

const fileToDisplayablePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 1200;
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
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const AddMealDrawer = forwardRef<HTMLDivElement, AddMealDrawerProps>(
  ({ open, onOpenChange, userId, date, onMealAdded }, ref) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const resetAll = useCallback(() => {
      setShowOverlay(false);
      setPhotoPreview(null);
    }, []);

    const resetAndClose = useCallback(() => {
      resetAll();
      onOpenChange(false);
    }, [onOpenChange, resetAll]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Close the drawer and show the fullscreen overlay immediately
      onOpenChange(false);

      let preview: string;
      try {
        preview = await fileToDisplayablePreview(file);
      } catch {
        const reader = new FileReader();
        preview = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setPhotoPreview(preview);
      setShowOverlay(true);

      try {
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${userId}/${Date.now()}.${ext}`;

        const [uploadResult, base64] = await Promise.all([
          supabase.storage.from("meal-photos").upload(filePath, file, { contentType: file.type }),
          resizeAndConvertToBase64(file),
        ]);

        if (uploadResult.error) throw uploadResult.error;

        const { data: urlData } = supabase.storage.from("meal-photos").getPublicUrl(filePath);

        const { data: analysis, error: fnErr } = await supabase.functions.invoke("analyze-meal", {
          body: { imageBase64: base64, description: "" },
        });

        if (fnErr) throw fnErr;

        // Auto-save the meal
        const { error: insertErr } = await supabase.from("meal_logs").insert({
          user_id: userId,
          date,
          meal_time: new Date().toISOString(),
          photo_url: urlData.publicUrl,
          description: analysis?.description || "",
          calories: analysis?.total_calories || 0,
          protein: analysis?.total_protein || 0,
          fiber: analysis?.total_fiber || 0,
          ai_analysis: analysis,
        } as any);

        if (insertErr) throw insertErr;

        toast.success("Refeição registrada! 🎉");
        await onMealAdded();
        resetAll();
      } catch (err: any) {
        console.error("Error analyzing/saving meal:", err);
        toast.error("Erro ao analisar refeição");
        resetAll();
      }

      // Reset file inputs so same file can be re-selected
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, [userId, date, onMealAdded, onOpenChange, resetAll]);

    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]" ref={ref}>
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-lg font-bold">Registrar Refeição</DrawerTitle>
            </DrawerHeader>

            <div className="px-5 pb-8 space-y-5">
              <div className="flex gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-40 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform touch-manipulation"
                >
                  <Camera className="w-8 h-8 text-primary/60" />
                  <span className="text-sm font-semibold text-primary/70">Câmera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-40 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform touch-manipulation"
                >
                  <ImagePlus className="w-8 h-8 text-muted-foreground/60" />
                  <span className="text-sm font-semibold text-muted-foreground/70">Galeria</span>
                </button>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </DrawerContent>
        </Drawer>

        {showOverlay && photoPreview && (
          <MealAnalysisOverlay photoPreview={photoPreview} />
        )}
      </>
    );
  }
);

AddMealDrawer.displayName = "AddMealDrawer";

export default AddMealDrawer;
