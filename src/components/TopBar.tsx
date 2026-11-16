import React from 'react';
import { SpotlyLogo } from './SpotlyLogo';

interface TopBarProps {
  savedCount: number;
  onNavigateSection: (sectionId: 'discover' | 'perks' | 'saved' | 'spotlight') => void;
  onOpenPartnerModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  savedCount,
  onNavigateSection,
  onOpenPartnerModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#discover"
          onClick={(e) => {
            e.preventDefault();
            onNavigateSection('discover');
          }}
          className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600 rounded-lg"
          aria-label="Spotly Home"
        >
          <SpotlyLogo size="md" />
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#discover"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('discover');
            }}
            className="whitespace-nowrap shrink-0 py-2 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white transition-colors"
          >
            Discover
          </a>
          <a
            href="#perks"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('perks');
            }}
            className="whitespace-nowrap shrink-0 py-2 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white transition-colors"
          >
            Local Perks
          </a>
          <a
            href="#saved"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('saved');
            }}
            className="whitespace-nowrap shrink-0 py-2 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white transition-colors tabular-nums"
          >
            {savedCount > 0 ? `Saved (${savedCount})` : 'Saved'}
          </a>
          <a
            href="#spotlight"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('spotlight');
            }}
            className="whitespace-nowrap shrink-0 py-2 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white transition-colors"
          >
            For Business
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenPartnerModal}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 active:scale-[0.99] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer"
          >
            List Business
          </button>
        </div>
      </div>
    </header>
  );
};
