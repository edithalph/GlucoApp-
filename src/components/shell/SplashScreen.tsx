"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const SPLASH_DURATION_MS = 1600;

/** Écran de lancement animé, fidèle à la maquette « Lancement de GlucoApp ». */
export function SplashScreen({ target }: { target: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace(target), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router, target]);

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-primary-container to-inverse-primary">
      <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />

      <div className="z-10 flex animate-[fade-in-up_1s_ease-out] flex-col items-center">
        <div className="relative mb-8 flex h-20 w-20 items-center justify-center drop-shadow-xl">
          <Icon
            name="water_drop"
            fill
            size={80}
            className="absolute text-on-primary"
          />
          <Icon
            name="show_chart"
            size={32}
            className="relative z-10 text-primary-container"
          />
        </div>

        <h1 className="mb-2 font-display-hero text-display-hero tracking-tight text-on-primary drop-shadow-md">
          GlucoApp
        </h1>
        <p className="font-body-md text-body-md tracking-wide text-on-primary opacity-70 drop-shadow-sm">
          Votre santé, votre rythme
        </p>
      </div>

      <div className="absolute bottom-16 z-10 flex w-full max-w-xs flex-col items-center px-container-padding-mobile">
        <div className="relative h-1 w-48 overflow-hidden rounded-full bg-on-primary/30">
          <div className="absolute bottom-0 left-0 top-0 animate-[progress_1.6s_ease-in-out_infinite] rounded-full bg-on-primary opacity-90" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progress {
          0% {
            width: 0%;
            transform: translateX(-100%);
          }
          50% {
            width: 50%;
            transform: translateX(50%);
          }
          100% {
            width: 100%;
            transform: translateX(100%);
          }
        }
      `}</style>
    </main>
  );
}
