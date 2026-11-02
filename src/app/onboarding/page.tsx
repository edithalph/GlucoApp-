"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

/** Les trois écrans d'introduction : glycémie, repas, thé. */
const SLIDES = [
  {
    icon: "show_chart",
    badge: null,
    title: "Comprenez votre glycémie",
    body: "Suivez l'impact de vos repas et découvrez comment les rituels de thé peuvent harmoniser votre équilibre quotidien.",
    tint: "primary",
  },
  {
    icon: "restaurant",
    badge: null,
    title: "Construisez votre repas",
    body: "Recherchez vos aliments, composez votre repas et découvrez instantanément son indice glycémique.",
    tint: "secondary",
  },
  {
    icon: "local_cafe",
    badge: "Fonctionnalité exclusive",
    title: "Mesurez l'effet de votre thé",
    body: "Découvrez comment vos infusions quotidiennes influencent positivement votre équilibre glycémique.",
    tint: "tertiary",
  },
] as const;

const TINTS = {
  primary: { blob: "bg-primary-fixed-dim/30", icon: "text-primary" },
  secondary: { blob: "bg-secondary-fixed-dim/30", icon: "text-secondary" },
  tertiary: { blob: "bg-tertiary-fixed-dim/30", icon: "text-tertiary" },
} as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const tint = TINTS[slide.tint];

  function next() {
    if (isLast) router.push("/inscription");
    else setIndex((i) => i + 1);
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-surface-container-lowest">
      {/* Zone illustration */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-container-padding-mobile md:px-container-padding-desktop">
        {!isLast && (
          <button
            onClick={() => router.push("/inscription")}
            className="absolute right-container-padding-mobile top-6 rounded-full px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            Passer
          </button>
        )}

        <div className="relative flex aspect-square w-full max-w-[320px] items-center justify-center">
          <div
            className={`absolute inset-0 scale-75 rounded-full ${tint.blob} blur-3xl`}
          />
          <Icon
            name={slide.icon}
            fill
            size={140}
            className={`relative z-10 ${tint.icon}`}
          />
        </div>
      </main>

      {/* Panneau de contenu */}
      <section className="relative z-20 flex flex-col items-center rounded-t-[28px] bg-surface px-container-padding-mobile pb-10 pt-stack-lg shadow-card">
        <div
          aria-label="Progression de l'intégration"
          className="mb-stack-lg flex items-center gap-unit"
        >
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-primary" : "w-2 bg-surface-variant"
              }`}
            />
          ))}
        </div>

        <div className="mb-auto w-full max-w-sm text-center">
          {slide.badge && (
            <span className="mb-stack-sm inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-3 py-1 font-label-md text-label-md uppercase tracking-wider text-on-tertiary-fixed-variant">
              <Icon name="auto_awesome" size={14} />
              {slide.badge}
            </span>
          )}
          <h1 className="mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile text-on-background">
            {slide.title}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {slide.body}
          </p>
        </div>

        <div className="mt-stack-lg flex w-full max-w-sm flex-col gap-stack-md">
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-title-lg text-title-lg text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {isLast ? "Commencer" : "Suivant"}
            <Icon name="arrow_forward" size={20} />
          </button>
          <Link
            href="/connexion"
            className="w-full rounded-xl py-2 text-center font-label-md text-label-md text-primary transition-colors hover:bg-surface-variant/50"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>
    </div>
  );
}
