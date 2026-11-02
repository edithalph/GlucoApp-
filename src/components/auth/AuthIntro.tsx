import { Icon } from "@/components/ui/Icon";

export function AuthIntro() {
  return (
    <aside className="dashboard-hero relative hidden min-h-screen flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
      <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-teal text-brand-navy">
          <Icon name="water_drop" fill />
        </span>
        GlucoApp
      </div>
      <div className="relative z-10 py-14">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-brand-mist">
          <span className="h-2 w-2 rounded-full bg-brand-gold" />
          Votre santé, votre rythme
        </span>
        <h2 className="max-w-md text-5xl font-semibold leading-[1.15] tracking-tight">
          Mieux se connaître.
          <br />
          <span className="text-brand-teal">Jour après jour.</span>
        </h2>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-brand-mist">
          Vos mesures, vos repas et vos habitudes réunis dans un espace pensé
          pour vous.
        </p>
        <div className="mt-10 flex flex-col gap-5 text-sm text-brand-mist">
          {[
            { icon: "bloodtype", text: "Retrouvez vos repères glycémiques" },
            {
              icon: "restaurant",
              text: "Composez vos repas en toute simplicité",
            },
            {
              icon: "history",
              text: "Observez votre évolution au fil du temps",
            },
          ].map((item) => (
            <p key={item.icon} className="flex items-center gap-3">
              <Icon name={item.icon} size={20} className="text-brand-teal" />
              {item.text}
            </p>
          ))}
        </div>
      </div>
      <p className="relative z-10 text-xs text-brand-mist">
        Un espace personnel pour accompagner votre quotidien.
      </p>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full border-[65px] border-brand-teal/10"
      />
    </aside>
  );
}
