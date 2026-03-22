import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface WhatsNewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WhatsNewDrawer = ({ open, onOpenChange }: WhatsNewDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <div className="px-6 pt-4 pb-6 space-y-5">
          <h2 className="text-2xl font-extrabold text-foreground">Novidades</h2>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
              <p className="text-[15px] text-foreground leading-relaxed">
                <strong>Novidade! 2 registros grátis por dia</strong>: Agora você pode registrar até 2 refeições por dia gratuitamente. Experimente na aba Refeições!
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              <p className="text-[15px] text-foreground leading-relaxed">
                <strong>Tela de Refeições redesenhada</strong>: Gráficos nutricionais semanais, controle de água e sequência diária para manter sua motivação.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              <p className="text-[15px] text-foreground leading-relaxed">
                <strong>Calendário de tratamento</strong>: Registre aplicações, peso e fotos em qualquer dia passado direto da tela inicial.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              <p className="text-[15px] text-foreground leading-relaxed">
                <strong>Backup na nuvem</strong>: Seus dados são sincronizados automaticamente para mantê-los seguros entre dispositivos.
              </p>
            </li>
          </ul>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Obrigado por usar o Mounja para apoiar sua jornada de saúde!
          </p>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold active:scale-[0.97] transition-transform"
          >
            Entendi
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default WhatsNewDrawer;
