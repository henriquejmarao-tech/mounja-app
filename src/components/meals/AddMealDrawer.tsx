import { useState, useRef, forwardRef, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Camera, ImagePlus, X, AlertCircle } from "lucide-react";
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

/** Convert file to a displayable JPEG data URL via canvas (handles .dng, .heic, etc.) */
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
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [imageReady, setImageReady] = useState(false);
    const [description, setDescription] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhoto(file);
      setImageReady(false);

      try {
        // Convert to displayable JPEG via canvas (handles .dng, .heic, raw formats)
        const preview = await fileToDisplayablePreview(file);
        setPhotoPreview(preview);
        setImageReady(true);
      } catch {
        // Fallback: try raw FileReader
        const reader = new FileReader();
        reader.onload = () => {
          setPhotoPreview(reader.result as string);
          // Check if the image actually renders
          const testImg = new Image();
          testImg.onload = () => setImageReady(true);
          testImg.onerror = () => {
            setImageReady(false);
            toast.error("Formato de imagem não suportado. Use JPG ou PNG.");
          };
          testImg.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    }, []);

    const resetAll = useCallback(() => {
      setPhoto(null);
      setPhotoPreview(null);
      setImageReady(false);
      setDescription("");
      setAnalyzing(false);
      setAnalysisResult(null);
      setShowOverlay(false);
      setUploadedUrl(null);
    }, []);

    const resetAndClose = useCallback(() => {
      resetAll();
      onOpenChange(false);
    }, [onOpenChange, resetAll]);

    const handleSubmit = useCallback(async () => {
      if (!photo || !photoPreview || !imageReady) {
        toast.error("Aguarde a imagem carregar antes de analisar");
        return;
      }

      // Show futuristic overlay
      setShowOverlay(true);
      setAnalyzing(true);
      setAnalysisResult(null);

      try {
        const ext = photo.name.split(".").pop() || "jpg";
        const filePath = `${userId}/${Date.now()}.${ext}`;

        const [uploadResult, base64] = await Promise.all([
          supabase.storage.from("meal-photos").upload(filePath, photo, { contentType: photo.type }),
          resizeAndConvertToBase64(photo),
        ]);

        if (uploadResult.error) throw uploadResult.error;

        const { data: urlData } = supabase.storage.from("meal-photos").getPublicUrl(filePath);
        setUploadedUrl(urlData.publicUrl);

        const { data: analysis, error: fnErr } = await supabase.functions.invoke("analyze-meal", {
          body: { imageBase64: base64, description },
        });

        if (fnErr) throw fnErr;

        setAnalysisResult(analysis);
        setAnalyzing(false);
      } catch (err: any) {
        console.error("Error analyzing meal:", err);
        toast.error("Erro ao analisar refeição");
        setShowOverlay(false);
        setAnalyzing(false);
      }
    }, [photo, photoPreview, imageReady, userId, description]);

    const handleSaveFromOverlay = useCallback(async () => {
      if (!analysisResult || !uploadedUrl) return;

      try {
        const { error: insertErr } = await supabase.from("meal_logs").insert({
          user_id: userId,
          date,
          meal_time: new Date().toISOString(),
          photo_url: uploadedUrl,
          description: analysisResult?.description || description,
          calories: analysisResult?.total_calories || 0,
          protein: analysisResult?.total_protein || 0,
          fiber: analysisResult?.total_fiber || 0,
          ai_analysis: analysisResult,
        } as any);

        if (insertErr) throw insertErr;

        toast.success("Refeição registrada! 🎉");
        // Await data refresh so meals & goals update before UI transitions
        await onMealAdded();
        resetAndClose();
      } catch (err: any) {
        console.error("Error saving meal:", err);
        toast.error("Erro ao salvar refeição");
      }
    }, [analysisResult, uploadedUrl, userId, date, description, onMealAdded, resetAndClose]);

    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]" ref={ref}>
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-lg font-bold">Registrar Refeição</DrawerTitle>
            </DrawerHeader>

            <div className="px-5 pb-8 space-y-5">
              {/* Photo area */}
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                  <img src={photoPreview} alt="Pré-visualização" className="w-full h-56 object-cover" />
                  {!imageReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Carregando imagem...</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { setPhoto(null); setPhotoPreview(null); setImageReady(false); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
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
              )}

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

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
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!photo || !imageReady || analyzing}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 touch-manipulation ${
                  photo && imageReady
                    ? "gradient-hero text-primary-foreground shadow-elevated scale-[1.01]"
                    : "bg-muted text-muted-foreground"
                } disabled:opacity-50`}
              >
                {photo && imageReady ? "📸 Analisar refeição" : "Registrar refeição"}
              </button>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Full-screen futuristic analysis overlay */}
        {showOverlay && photoPreview && (
          <MealAnalysisOverlay
            photoPreview={photoPreview}
            analyzing={analyzing}
            result={analysisResult}
            onClose={handleSaveFromOverlay}
          />
        )}
      </>
    );
  }
);

AddMealDrawer.displayName = "AddMealDrawer";

export default AddMealDrawer;
