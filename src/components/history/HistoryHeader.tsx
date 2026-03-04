const HistoryHeader = () => {
  return (
    <header className="sticky top-0 z-30">
      <div
        className="px-5 pb-10"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
          background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 40%, hsl(var(--primary) / 0.5) 70%, transparent 100%)",
        }}
      >
        <h1 className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-[0.15em]">Seu Progresso</h1>
      </div>
    </header>
  );
};

export default HistoryHeader;
