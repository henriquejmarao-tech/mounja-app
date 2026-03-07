import { useState, useCallback, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { Check } from "lucide-react";

const symptomCategories = [
  {
    title: "Sintomas",
    color: "bg-blue-100 text-blue-700",
    activeColor: "bg-blue-500 text-white ring-2 ring-blue-500/30 shadow-sm",
    items: [
      { key: "symptom_nausea", label: "Náusea", emoji: "🤢" },
      { key: "symptom_constipation", label: "Constipação", emoji: "😣" },
      { key: "symptom_diarrhea", label: "Diarreia", emoji: "💧" },
      { key: "symptom_headache", label: "Dor de cabeça", emoji: "🤕" },
      { key: "symptom_fatigue", label: "Fadiga", emoji: "😴" },
      { key: "symptom_dizziness", label: "Tontura", emoji: "😵" },
      { key: "symptom_bloating", label: "Inchaço", emoji: "🎈" },
      { key: "symptom_heartburn", label: "Azia", emoji: "🔥" },
    ],
  },
  {
    title: "Apetite",
    color: "bg-orange-100 text-orange-700",
    activeColor: "bg-orange-500 text-white ring-2 ring-orange-500/30 shadow-sm",
    items: [
      { key: "appetite_suppressed", label: "Sem apetite", emoji: "🚫" },
      { key: "appetite_cravings", label: "Compulsão", emoji: "🍫" },
      { key: "appetite_healthy", label: "Comendo bem", emoji: "🥗" },
      { key: "appetite_junk", label: "Junk food", emoji: "🍔" },
    ],
  },
  {
    title: "Reação na aplicação",
    color: "bg-red-100 text-red-700",
    activeColor: "bg-red-500 text-white ring-2 ring-red-500/30 shadow-sm",
    items: [
      { key: "symptom_injection_pain", label: "Dor", emoji: "💉" },
      { key: "injection_swelling", label: "Inchaço", emoji: "🔺" },
      { key: "injection_rash", label: "Vermelhidão", emoji: "🔴" },
      { key: "injection_bruising", label: "Hematoma", emoji: "🟣" },
    ],
  },
  {
    title: "Humor",
    color: "bg-yellow-100 text-yellow-700",
    activeColor: "bg-yellow-500 text-white ring-2 ring-yellow-500/30 shadow-sm",
    items: [
      { key: "mood_calm", label: "Calmo", emoji: "😌" },
      { key: "mood_happy", label: "Feliz", emoji: "😊" },
      { key: "mood_energetic", label: "Energético", emoji: "⚡" },
      { key: "mood_anxious", label: "Ansioso", emoji: "😰" },
      { key: "mood_foggy", label: "Confuso", emoji: "🌫️" },
      { key: "mood_irritable", label: "Irritado", emoji: "😤" },
    ],
  },
];

interface SymptomCheckinDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: Date;
}

const SymptomCheckinDrawer = ({ open, onOpenChange, date }: SymptomCheckinDrawerProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing data when drawer opens
  useEffect(() => {
    if (!open || !user) {
      setLoaded(false);
      return;
    }
    const loadExisting = async () => {
      const dateStr = localDateStr(date || new Date());
      const { data } = await supabase
        .from("daily_logs")
        .select("symptom_nausea, symptom_constipation, symptom_diarrhea, symptom_headache, symptom_fatigue, symptom_injection_pain, notes")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .limit(1);
      
      const existing = (data as any[])?.[0];
      if (existing) {
        const restored: Record<string, boolean> = {};
        const dbKeys = ["symptom_nausea", "symptom_constipation", "symptom_diarrhea", "symptom_headache", "symptom_fatigue", "symptom_injection_pain"];
        dbKeys.forEach((key) => {
          if (existing[key] && existing[key] > 0) restored[key] = true;
        });
        // Restore extra symptoms from notes
        if (existing.notes) {
          const checkinMatch = existing.notes.match(/Checkin: (.+)/);
          if (checkinMatch) {
            const labels = checkinMatch[1].split(", ");
            for (const cat of symptomCategories) {
              for (const item of cat.items) {
                if (labels.some((l: string) => l.includes(item.label))) {
                  restored[item.key] = true;
                }
              }
            }
          }
        }
        setSelected(restored);
      } else {
        setSelected({});
      }
      setLoaded(true);
    };
    loadExisting();
  }, [open, user, date]);

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const dateStr = localDateStr(date || new Date());
      // Build payload with known DB columns
      const dbFields: Record<string, number> = {};
      const knownColumns = ["symptom_nausea", "symptom_constipation", "symptom_diarrhea", "symptom_headache", "symptom_fatigue", "symptom_injection_pain"];
      knownColumns.forEach((key) => {
        if (selected[key]) dbFields[key] = 1;
      });

      // Collect non-DB symptoms into notes
      const extraSymptoms = Object.entries(selected)
        .filter(([key, val]) => val && !knownColumns.includes(key))
        .map(([key]) => {
          for (const cat of symptomCategories) {
            const item = cat.items.find((i) => i.key === key);
            if (item) return `${item.emoji} ${item.label}`;
          }
          return key;
        });

      const { data } = await supabase.from("daily_logs").select("id, notes").eq("user_id", user.id).eq("date", dateStr).limit(1);
      const existing = (data as any[])?.[0];

      const notesExtra = extraSymptoms.length > 0 ? `Checkin: ${extraSymptoms.join(", ")}` : null;
      const payload: any = { user_id: user.id, date: dateStr, ...dbFields };
      if (notesExtra) {
        payload.notes = existing?.notes ? `${existing.notes}\n${notesExtra}` : notesExtra;
      }

      if (existing) {
        await supabase.from("daily_logs").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("daily_logs").insert(payload);
      }

      toast.success("Check-in salvo ✓");
      setSelected({});
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  }, [user, selected, onOpenChange]);

  const hasSelection = Object.values(selected).some(Boolean);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="px-6 pt-2 pb-1">
            <p className="text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5 mb-1">
              🛡️ Seus dados estão protegidos
            </p>
            <DrawerTitle className="text-left text-xl font-bold text-foreground">
              Como você está se sentindo?
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pb-6 overflow-y-auto max-h-[60vh] space-y-5">
            {symptomCategories.map((cat) => (
              <div key={cat.title}>
                <h3 className="font-bold text-base text-foreground mb-2.5">{cat.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item) => {
                    const isActive = !!selected[item.key];
                    return (
                      <button
                        key={item.key}
                        onClick={() => toggle(item.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95",
                          isActive ? cat.activeColor : cat.color
                        )}
                      >
                        <span className="text-base">{item.emoji}</span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {hasSelection && (
            <div className="px-6 pb-6 pt-2 animate-fade-in-up">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold shadow-elevated active:scale-[0.97] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Salvar check-in
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SymptomCheckinDrawer;
