import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  style?: React.CSSProperties;
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <>
      <style>{`
        /* ── Selected day: gradient border on white ── */
        .cal-grad-selected {
          background: #fff !important;
          color: #111 !important;
          font-weight: 700 !important;
          position: relative !important;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        .cal-grad-selected::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 2px;
          background: linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .cal-grad-selected:hover,
        .cal-grad-selected:focus {
          background: #fff !important;
          color: #111 !important;
        }
        .cal-cell-override [aria-selected="true"] {
          background: #fff !important;
        }
        .cal-cell-override:has([aria-selected]) {
          background: transparent !important;
        }

        /* ── Application day: filled gradient ── */
        @keyframes applicationPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(123, 47, 247, 0.3); }
          50% { box-shadow: 0 0 10px 3px rgba(123, 47, 247, 0.15); }
        }
        .cal-application-day {
          background: linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%) !important;
          color: #fff !important;
          font-weight: 700 !important;
          border-radius: 9999px !important;
          transform: scale(1.12);
          transition: all 0.2s ease;
          animation: applicationPulse 2.5s ease-in-out infinite;
        }
        .cal-application-day:hover,
        .cal-application-day:focus {
          background: linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%) !important;
          color: #fff !important;
        }
        /* When application day is also selected, gradient fill wins */
        .cal-application-day.cal-grad-selected {
          background: linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%) !important;
          color: #fff !important;
        }
        .cal-application-day.cal-grad-selected::before {
          display: none;
        }

        /* ── Today (non-application): subtle neutral ── */
        .cal-today-neutral {
          background: hsl(0 0% 96%) !important;
          color: hsl(0 0% 15%) !important;
          font-weight: 600 !important;
          border-radius: 9999px !important;
          position: relative !important;
          box-shadow: inset 0 0 0 1.5px rgba(123, 47, 247, 0.25);
        }
      `}</style>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-bold",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-none",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "cal-cell-override h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected: "cal-grad-selected",
          day_today: "cal-today-neutral",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-transparent aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
