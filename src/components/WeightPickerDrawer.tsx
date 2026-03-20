import { useState, useRef, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface WeightPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWeight?: number;
  onSave: (weight: number) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2);

const integerRange = Array.from({ length: 200 }, (_, i) => i + 30); // 30-229 kg
const decimalRange = Array.from({ length: 10 }, (_, i) => i); // 0-9

function useScrollPicker(items: number[], initial: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(initial);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const scrollToIndex = useCallback((index: number, smooth = false) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  useEffect(() => {
    const idx = items.indexOf(initial);
    if (idx >= 0) {
      setSelected(items[idx]);
      requestAnimationFrame(() => scrollToIndex(idx, false));
    }
  }, [initial, items, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    isScrollingRef.current = true;
    clearTimeout(timeoutRef.current);

    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setSelected(items[clamped]);

    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      scrollToIndex(clamped, true);
    }, 100);
  }, [items, scrollToIndex]);

  return { ref, selected, handleScroll, scrollToIndex, items };
}

const WeightPickerDrawer = ({ open, onOpenChange, initialWeight = 74, onSave }: WeightPickerDrawerProps) => {
  const intPart = Math.floor(initialWeight);
  const decPart = Math.round((initialWeight - intPart) * 10);

  const intPicker = useScrollPicker(integerRange, intPart);
  const decPicker = useScrollPicker(decimalRange, decPart);

  const handleDone = () => {
    const weight = intPicker.selected + decPicker.selected / 10;
    onSave(weight);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <div className="mx-auto w-full max-w-md px-6 pb-6">
          <DrawerHeader className="px-0 pt-2 pb-4">
            <DrawerTitle className="text-center text-xl font-bold text-foreground">
              Atualizar peso
            </DrawerTitle>
          </DrawerHeader>

          {/* Picker area */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {/* Integer picker */}
            <ScrollColumn picker={intPicker} />

            <span className="text-2xl font-bold text-foreground pb-1">.</span>

            {/* Decimal picker */}
            <ScrollColumn picker={decPicker} />

            <span className="text-lg font-semibold text-muted-foreground ml-2">kg</span>
          </div>

          {/* Done button */}
          <button
            onClick={handleDone}
            className="w-full gradient-hero text-primary-foreground py-4 rounded-2xl text-base font-bold shadow-elevated active:scale-[0.97] transition-transform"
          >
            Salvar
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

function ScrollColumn({ picker }: { picker: ReturnType<typeof useScrollPicker> }) {
  const { ref, selected, handleScroll, items } = picker;
  const containerHeight = VISIBLE_ITEMS * ITEM_HEIGHT;

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: containerHeight, width: 120 }}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 bg-muted/60 rounded-xl pointer-events-none z-10"
        style={{
          top: CENTER_OFFSET * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        }}
      />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto scrollbar-none snap-y snap-mandatory"
        style={{
          paddingTop: CENTER_OFFSET * ITEM_HEIGHT,
          paddingBottom: CENTER_OFFSET * ITEM_HEIGHT,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((val) => {
          const isSelected = val === selected;
          return (
            <div
              key={val}
              className={cn(
                "flex items-center justify-center snap-center transition-all duration-150",
                isSelected
                  ? "text-foreground text-2xl font-bold"
                  : "text-muted-foreground/60 text-lg font-medium"
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {val}
            </div>
          );
        })}
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
    </div>
  );
}

export default WeightPickerDrawer;
