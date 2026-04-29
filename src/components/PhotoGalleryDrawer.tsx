import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, Camera, ShieldCheck, ImagePlus } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface Photo {
  id: string;
  url: string;
  date: string;
  photo_url: string;
}

interface PhotoGalleryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  uploadDate?: string;
  onPhotosChanged?: () => void;
}

const PhotoGalleryDrawer = ({ open, onOpenChange, initialIndex = 0, uploadDate, onPhotosChanged }: PhotoGalleryDrawerProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const uploadDateStr = uploadDate || localDateStr(new Date());

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("progress_photos")
      .select("id, photo_url, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    const raw = (data as any[]) || [];
    const withUrls = await Promise.all(
      raw.map(async (p) => {
        const { data: signed } = await supabase.storage
          .from("progress-photos")
          .createSignedUrl(p.photo_url, 3600);
        return { id: p.id, url: signed?.signedUrl || "", date: p.date, photo_url: p.photo_url };
      })
    );
    setPhotos(withUrls.filter((p) => p.url));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchPhotos();
      setActiveIndex(initialIndex);
    }
  }, [open, fetchPhotos, initialIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    setActiveIndex(Math.round(scrollLeft / width));
  };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${uploadDateStr}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("progress-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from("progress_photos").insert({ user_id: user.id, date: uploadDateStr, photo_url: path } as any);
      toast.success("Foto salva ✓");
      await fetchPhotos();
      onPhotosChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    }
    setUploading(false);
    e.target.value = "";
  }, [user, uploadDateStr, fetchPhotos, onPhotosChanged]);

  const handleDelete = useCallback(async (photo: Photo) => {
    if (!user) return;
    try {
      await supabase.storage.from("progress-photos").remove([photo.photo_url]);
      await supabase.from("progress_photos").delete().eq("id", photo.id);
      toast.success("Foto removida");
      await fetchPhotos();
      onPhotosChanged?.();
    } catch {
      toast.error("Erro ao remover");
    }
  }, [user, fetchPhotos, onPhotosChanged]);

  const currentPhoto = photos[activeIndex];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] pb-safe">
        <div className="flex flex-col h-full">
          {/* Privacy notice */}
          <div className="flex items-center justify-center gap-2 py-3">
            <ShieldCheck className="w-4 h-4" style={{ color: "hsl(270,60%,55%)" }} />
            <span className="text-sm font-semibold text-foreground">Suas fotos são privadas</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
            </div>
          ) : photos.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <style>{`.pgd-scroll::-webkit-scrollbar{display:none}`}</style>
                {photos.map((photo) => (
                  <div key={photo.id} className="min-w-full snap-center flex flex-col items-center px-5">
                    <div className="w-full rounded-3xl overflow-hidden bg-muted aspect-[3/4] max-h-[55vh]">
                      <img src={photo.url} alt="Progresso" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mt-3">
                      {new Date(photo.date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dot indicators */}
              {photos.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 py-3">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === activeIndex
                          ? "w-5"
                          : "w-2 bg-muted-foreground/20"
                      )}
                      style={i === activeIndex ? { background: "linear-gradient(to right, #7B2FF7, #F857A6)" } : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(270,80%,96%), hsl(330,60%,96%))" }}>
                <Camera className="w-8 h-8" style={{ color: "hsl(270,60%,55%)" }} />
              </div>
              <p className="text-lg font-bold text-foreground">Nenhuma foto ainda</p>
              <p className="text-sm text-muted-foreground text-center">
                Tire sua primeira foto de progresso para acompanhar sua evolução
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-5 pb-4 flex gap-3">
            {currentPhoto && (
              <button
                onClick={() => handleDelete(currentPhoto)}
                className="w-14 h-14 rounded-2xl bg-card border border-destructive/20 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
              >
                <Trash2 className="w-5 h-5 text-destructive" />
              </button>
            )}
            <label className={cn(
              "w-14 h-14 rounded-2xl bg-card border border-border/40 flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform",
              uploading && "opacity-50 pointer-events-none"
            )}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5" style={{ color: "hsl(270,60%,55%)" }} />
              )}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            <label className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform ml-auto",
              uploading && "opacity-50 pointer-events-none"
            )} style={{ background: "linear-gradient(to right, #7B2FF7, #F857A6)", boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)" }}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PhotoGalleryDrawer;
