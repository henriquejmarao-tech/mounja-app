import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, Camera, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Photo {
  id: string;
  url: string;
  date: string;
  photo_url: string; // storage path
}

const PhotoGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const todayStr = localDateStr(new Date());

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
        return {
          id: p.id,
          url: signed?.signedUrl || "",
          date: p.date,
          photo_url: p.photo_url,
        };
      })
    );

    setPhotos(withUrls.filter((p) => p.url));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    setActiveIndex(Math.round(scrollLeft / width));
  };

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${todayStr}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("progress-photos")
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        await supabase.from("progress_photos").insert({
          user_id: user.id,
          date: todayStr,
          photo_url: path,
        } as any);

        toast.success("Foto salva ✓");
        await fetchPhotos();
      } catch (err: any) {
        toast.error(err.message || "Erro ao enviar foto");
      }
      setUploading(false);
    },
    [user, todayStr, fetchPhotos]
  );

  const handleDelete = useCallback(
    async (photo: Photo) => {
      if (!user) return;
      try {
        await supabase.storage.from("progress-photos").remove([photo.photo_url]);
        await supabase.from("progress_photos").delete().eq("id", photo.id);
        toast.success("Foto removida");
        await fetchPhotos();
      } catch {
        toast.error("Erro ao remover");
      }
    },
    [user, fetchPhotos]
  );

  const currentPhoto = photos[activeIndex];
  const isToday = currentPhoto?.date === todayStr;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-nav flex flex-col">
      {/* Drag handle */}
      <div className="flex justify-center pt-safe pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Privacy notice */}
      <div className="flex items-center justify-center gap-2 py-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Suas fotos são privadas</span>
      </div>

      {/* Photo carousel */}
      {photos.length > 0 ? (
        <div className="flex-1 flex flex-col">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.photo-gallery-scroll::-webkit-scrollbar{display:none}`}</style>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="min-w-full snap-center flex flex-col items-center px-5"
              >
                <div className="w-full rounded-3xl overflow-hidden bg-muted aspect-[3/4] max-h-[65vh]">
                  <img
                    src={photo.url}
                    alt="Progresso"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-3">
                  {new Date(photo.date + "T12:00:00").toLocaleDateString("pt-BR", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 py-3">
            {photos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === activeIndex ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5">
          <p className="text-lg font-bold text-foreground">Nenhuma foto ainda</p>
          <p className="text-sm text-muted-foreground text-center">
            Tire sua primeira foto de progresso para acompanhar sua evolução
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 pb-6 flex gap-3">
        {/* Delete - always visible if there's a photo */}
        {currentPhoto && (
          <button
            onClick={() => handleDelete(currentPhoto)}
            className="w-14 h-14 rounded-2xl bg-card border border-destructive/20 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
          </button>
        )}

        {/* Add photo from gallery */}
        <label
          className={cn(
            "w-14 h-14 rounded-2xl bg-card border border-primary/20 flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <ImagePlus className="w-5 h-5 text-primary" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {/* Take photo with camera */}
        <label
          className={cn(
            "w-14 h-14 rounded-2xl bg-card border border-primary/20 flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform ml-auto",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-primary" />
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
};

export default PhotoGallery;
