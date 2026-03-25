import { cn } from "@/lib/utils";

interface FireIconProps {
  width?: number;
  height?: number;
  opacity?: number;
  className?: string;
}

const FireIcon = ({ width = 13, height = 15, opacity = 1, className }: FireIconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 28"
    fill="none"
    className={cn(className)}
    style={{ opacity }}
  >
    <defs>
      <linearGradient id="fire-outer" x1="12" y1="28" x2="12" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" />
        <stop offset="0.5" stopColor="#ec4899" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="fire-mid" x1="12" y1="28" x2="12" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" />
        <stop offset="0.5" stopColor="#ec4899" />
        <stop offset="1" stopColor="#a78bfa" />
      </linearGradient>
      <linearGradient id="fire-inner" x1="12" y1="28" x2="12" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb923c" />
        <stop offset="0.5" stopColor="#f472b6" />
        <stop offset="1" stopColor="#c4b5fd" />
      </linearGradient>
      <radialGradient id="fire-glow" cx="12" cy="26" r="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" stopOpacity="0.4" />
        <stop offset="1" stopColor="#f97316" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Glow */}
    <ellipse cx="12" cy="26" rx="8" ry="3" fill="url(#fire-glow)" className="f-glow" />
    {/* Outer flame */}
    <path
      className="f-outer"
      d="M12 1C12 1 4 10 4 17c0 4.4 3.6 8 8 8s8-3.6 8-8C20 10 12 1 12 1z"
      fill="url(#fire-outer)"
    />
    {/* Mid flame */}
    <path
      className="f-mid"
      d="M12 6C12 6 7 13 7 18c0 2.8 2.2 5 5 5s5-2.2 5-5C17 13 12 6 12 6z"
      fill="url(#fire-mid)"
    />
    {/* Inner flame */}
    <path
      className="f-inner"
      d="M12 11C12 11 9.5 15 9.5 18.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5C14.5 15 12 11 12 11z"
      fill="url(#fire-inner)"
    />
  </svg>
);

export default FireIcon;
