import { useState, useCallback, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { Camera, Trash2, Shield } from "lucide-react";

interface PhotoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: Date;
}

const PhotoDrawer = ({ open, onOpenChange, date }: PhotoDrawerProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [todayPhoto, setTodayPhoto] = useState<{ id: string; url: string; date: string } | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const dateStr = localDateStr(date || new Date());

  const loadTodayPhoto = useCallback(async () => {
    if (!user) return;
    setLoadingPhoto(true);
    const { data } = await supabase
      .from("progress_photos" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .order("created_at", { ascending: false })
      .limit(1);

    const photo = (data as any[])?.[0];
    if (photo) {
      // Get signed URL
      const { data: signedData } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(photo.photo_url, 3600);
      setTodayPhoto({
        id: photo.id,
        url: signedData?.signedUrl || "",
        date: photo.date,
      });
    } else {
      setTodayPhoto(null);
    }
    setLoadingPhoto(false);
  }, [user, dateStr]);

  useEffect(() => {
    if (open) loadTodayPhoto();
  }, [open, loadTodayPhoto]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${dateStr}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save reference in DB
      await supabase.from("progress_photos" as any).insert({
        user_id: user.id,
        date: dateStr,
        photo_url: path,
      } as any);

      toast.success("Foto salva ✓");
      await loadTodayPhoto();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    }
    setUploading(false);
  }, [user, dateStr, loadTodayPhoto]);

  const handleDelete = useCallback(async () => {
    if (!todayPhoto || !user) return;
    try {
      // Get photo_url from DB to delete from storage
      const { data } = await supabase
        .from("progress_photos" as any)
        .select("photo_url")
        .eq("id", todayPhoto.id)
        .limit(1);
      const photoUrl = (data as any[])?.[0]?.photo_url;

      if (photoUrl) {
        await supabase.storage.from("progress-photos").remove([photoUrl]);
      }
      await supabase.from("progress_photos" as any).delete().eq("id", todayPhoto.id);

      setTodayPhoto(null);
      toast.success("Foto removida");
    } catch {
      toast.error("Erro ao remover");
    }
  }, [todayPhoto, user]);

  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <div className="mx-auto w-full max-w-md px-6 pb-6">
          <DrawerHeader className="px-0 pt-2 pb-1">
            <p className="text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Suas fotos são privadas
            </p>
            <DrawerTitle className="sr-only">Foto de progresso</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            {loadingPhoto ? (
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : todayPhoto?.url ? (
              <div className="w-full space-y-4">
                <img
                  src={todayPhoto.url}
                  alt="Foto de progresso"
                  className="w-full rounded-2xl object-cover max-h-[50vh]"
                />
                <p className="text-center text-sm text-muted-foreground font-medium">
                  {formattedDate}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/20 text-destructive text-sm font-semibold active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer active:scale-95 transition-transform">
                    <Camera className="w-4 h-4" />
                    Trocar
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <p className="text-xl font-bold text-foreground">Adicionar foto</p>
                <label className={`w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center cursor-pointer active:scale-90 transition-transform ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-primary" />
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
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PhotoDrawer;
