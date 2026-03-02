import { Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoseTimelineProps {
  injections: any[];
}

const DoseTimeline = ({ injections }: DoseTimelineProps) => {
  if (injections.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
      <div className="p-4 pb-2">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Syringe className="w-4 h-4 text-primary" /> Linha do tempo de doses
        </h3>
      </div>
      <div className="px-4 pb-4">
        {injections.slice(0, 6).map((inj: any, i: number) => (
          <div key={inj.id} className="flex gap-3 relative">
            <div className="flex flex-col items-center">
              <div className={cn("w-3 h-3 rounded-full border-2 mt-1.5", i === 0 ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted")} />
              {i < Math.min(injections.length, 6) - 1 && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold">{inj.dose}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(inj.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                {inj.site && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{inj.site}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoseTimeline;
