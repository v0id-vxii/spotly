import React from 'react';
import { Bookmark, MapPin, Navigation, Trash2 } from 'lucide-react';
import type { DiscoveredPlace } from '../types';

interface SavedSpotsSectionProps {
  savedPlaces: DiscoveredPlace[];
  onSelectPlace: (place: DiscoveredPlace) => void;
  onRemoveSaved: (placeId: string) => void;
  onDirections: (place: DiscoveredPlace) => void;
}

export const SavedSpotsSection: React.FC<SavedSpotsSectionProps> = ({
  savedPlaces,
  onSelectPlace,
  onRemoveSaved,
  onDirections,
}) => {
  return (
    <section id="saved" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            Your Shortlist
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Saved stores & restaurants
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
          {savedPlaces.length} {savedPlaces.length === 1 ? 'place' : 'places'} saved on this device
        </p>
      </div>

      {savedPlaces.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <Bookmark className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-white">
            No saved spots yet
          </p>
          <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Tap the bookmark button on any restaurant, cafe, or shop above to keep it handy for your next outing.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedPlaces.map((place) => (
            <article
              key={place.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    className="min-w-0 text-left cursor-pointer"
                  >
                    <h3 className="font-display text-base font-bold text-slate-950 hover:text-rose-600 dark:text-white dark:hover:text-rose-400 truncate">
                      {place.displayName}
                    </h3>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(place.id)}
                    aria-label={`Remove ${place.displayName}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="line-clamp-2">{place.formattedAddress}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectPlace(place)}
                  className="min-h-[38px] flex-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Open Details
                </button>
                <button
                  type="button"
                  onClick={() => onDirections(place)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 cursor-pointer"
                >
                  <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  Route
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
