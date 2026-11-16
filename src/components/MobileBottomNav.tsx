import React from 'react';
import { Bookmark, Compass, Map as MapIcon, Tag } from 'lucide-react';
import type { MobileTab } from '../types';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  savedCount: number;
  onSelectTab: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  savedCount,
  onSelectTab,
}) => {
  const tabs: { id: MobileTab; label: string; Icon: typeof Compass }[] = [
    { id: 'discover', label: 'Feed', Icon: Compass },
    { id: 'map', label: 'Map', Icon: MapIcon },
    { id: 'perks', label: 'Perks', Icon: Tag },
    {
      id: 'saved',
      label: savedCount > 0 ? `Saved (${savedCount})` : 'Saved',
      Icon: Bookmark,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
    >
      <div className="grid h-16 grid-cols-4 items-center">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                active
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate max-w-[76px]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
