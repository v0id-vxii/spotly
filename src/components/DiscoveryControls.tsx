import React from 'react';
import {
  Clock,
  LocateFixed,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  Type as TypeIcon,
  X,
} from 'lucide-react';
import {
  CATEGORY_OPTIONS,
  PRESET_NEIGHBORHOODS,
  TASTE_OPTIONS,
  type CategoryFilter,
  type PlaceLocationState,
  type TastePreference,
  type ThemeMode,
} from '../types';
import { LocationAutocomplete } from './LocationAutocomplete';

interface DiscoveryControlsProps {
  theme: ThemeMode;
  onToggleTheme: (next: ThemeMode) => void;
  easyRead: boolean;
  onToggleEasyRead: () => void;
  location: PlaceLocationState;
  isLocating: boolean;
  locationNotice: string | null;
  onUseCurrentLocation: () => void;
  onSelectLocation: (loc: PlaceLocationState) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  category: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  selectedTastes: TastePreference[];
  onToggleTaste: (taste: TastePreference) => void;
  mapsReady: boolean;
}

export const DiscoveryControls: React.FC<DiscoveryControlsProps> = ({
  theme,
  onToggleTheme,
  easyRead,
  onToggleEasyRead,
  location,
  isLocating,
  locationNotice,
  onUseCurrentLocation,
  onSelectLocation,
  searchQuery,
  onSearchQueryChange,
  onSubmitSearch,
  onClearSearch,
  category,
  onCategoryChange,
  openNowOnly,
  onToggleOpenNow,
  selectedTastes,
  onToggleTaste,
  mapsReady,
}) => {
  return (
    <section
      id="discover"
      className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              Personalized Local Guide
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl text-balance">
              Discover trusted restaurants and local shops around {location.label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Color theme"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => onToggleTheme('light')}
                aria-pressed={theme === 'light'}
                className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                Dark
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleEasyRead}
              aria-pressed={easyRead}
              title="Increase text size for comfortable reading"
              className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                easyRead
                  ? 'border-rose-600 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-950/50 dark:text-rose-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <TypeIcon className="h-4 w-4" aria-hidden="true" />
              <span>{easyRead ? 'Large Text: On' : 'Easy-Read Text'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <form
            onSubmit={onSubmitSearch}
            className="flex flex-1 items-center gap-2"
            role="search"
            aria-label="Search local stores and restaurants"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder='Search "quiet bakery", "bookshop", "family dinner"...'
                aria-label="Search restaurants, stores, or describe what you are looking for"
                className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-base text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  aria-label="Clear search query"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="min-h-[48px] whitespace-nowrap shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Find Spots
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <LocateFixed className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
            </button>

            {mapsReady && (
              <LocationAutocomplete
                currentLocationLabel={location.label}
                onSelectLocation={onSelectLocation}
              />
            )}
          </div>
        </div>

        {locationNotice && (
          <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400" role="status">
            {locationNotice}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Quick jump:</span>
          {PRESET_NEIGHBORHOODS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectLocation(preset)}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                location.label === preset.label
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Business categories"
              className="flex flex-wrap items-center gap-1.5"
            >
              {CATEGORY_OPTIONS.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onToggleOpenNow}
              aria-pressed={openNowOnly}
              className={`ml-auto flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                openNowOnly
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Open Now</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              Personalize for:
            </span>
            {TASTE_OPTIONS.map((taste) => {
              const selected = selectedTastes.includes(taste.id);
              return (
                <button
                  key={taste.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleTaste(taste.id)}
                  className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {taste.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
