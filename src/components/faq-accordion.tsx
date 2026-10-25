"use client";

import { useState } from "react";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-2xs transition-all duration-200 dark:border-brand-900/80 dark:bg-brand-950/40"
          >
            <button
              id={buttonId}
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-bold text-brand-950 transition-colors hover:text-brand-800 dark:text-brand-100 dark:hover:text-brand-200 sm:text-lg"
            >
              <span className="flex-1 leading-snug">{item.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-transform duration-200 dark:bg-brand-900/60 dark:text-brand-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-brand-100/60 px-5 pt-3 pb-5 text-sm leading-relaxed text-muted dark:border-brand-900/60 dark:text-brand-300 sm:text-base animate-fade-in"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
