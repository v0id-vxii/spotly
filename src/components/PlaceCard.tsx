import React, { useState } from 'react';
import {
  Bookmark,
  Navigation,
  Star,
  Store,
  Utensils,
} from 'lucide-react';
import type { DiscoveredPlace } from '../types';
import { formatDistanceLabel, formatPriceLevel } from '../utils/placesHelpers';

interface PlaceCardProps {
  place: DiscoveredPlace;
  isSelected: boolean;
  isHovered: boolean;
  isSaved: boolean;
  onHover: (id: string | null) => void;
  onSelect: (place: DiscoveredPlace) => void;
  onToggleSave: (place: DiscoveredPlace) => void;
  onDirections: (place: DiscoveredPlace) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  isHovered,
  isSaved,
  onHover,
  onSelect,
  onToggleSave,
  onDirections,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const distanceText = formatDistanceLabel(place.distanceMeters);
  const priceText = formatPriceLevel(place.priceLevel);
  const categoryText =
    place.primaryTypeDisplayName ||
    (place.primaryType ? place.primaryType.replace(/_/g, ' ') : 'Local Spot');

  const isFood =
    place.primaryType?.includes('restaurant') ||
    place.primaryType?.includes('cafe') ||
    place.primaryType?.includes('bakery');

  const metadataParts = [
    categoryText,
    distanceText,
    priceText,
    place.isOpen === true
      ? 'Open Now'
      : place.isOpen === false
        ? 'Closed'
        : '',
  ].filter(Boolean);

  return (
    <article
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      className={`group rounded-2xl border transition-all duration-150 ${
        isSelected
          ? 'border-rose-500 bg-rose-50/40 shadow-sm dark:border-rose-400 dark:bg-rose-950/20'
          : isHovered
            ? 'border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'
            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <button
          type="button"
          onClick={() => onSelect(place)}
          className="relative h-40 w-full sm:h-32 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          aria-label={`View details for ${place.displayName}`}
        >
          {place.photo?.uri && !imgFailed ? (
            <img
              src={place.photo.uri}
              alt={place.displayName}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-3 text-slate-500 dark:from-slate-800 dark:to-slate-900 dark:text-slate-400">
              {isFood ? (
                <Utensils className="h-7 w-7 text-rose-500" aria-hidden="true" />
              ) : (
                <Store className="h-7 w-7 text-rose-500" aria-hidden="true" />
              )}
              <span className="mt-1.5 text-center text-xs font-medium line-clamp-1">
                {categoryText}
              </span>
            </div>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelect(place)}
                className="min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 rounded"
              >
                <h3 className="font-display text-base font-bold text-slate-950 group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400 truncate">
                  {place.displayName}
                </h3>
              </button>

              <button
                type="button"
                onClick={() => onToggleSave(place)}
                aria-label={
                  isSaved
                    ? `Remove ${place.displayName} from saved`
                    : `Save ${place.displayName}`
                }
                aria-pressed={isSaved}
                className={`flex min-h-[44px] min-w-[44px] -mt-1.5 -mr-1.5 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isSaved
                    ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/60'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Bookmark
                  className="h-5 w-5"
                  fill={isSaved ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {metadataParts.map((part, i) => (
                <React.Fragment key={`${part}-${i}`}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <span
                    className={
                      part === 'Open Now'
                        ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                        : part === 'Closed'
                          ? 'font-medium text-slate-500 dark:text-slate-400'
                          : 'capitalize'
                    }
                  >
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {typeof place.rating === 'number' && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-800 dark:text-slate-200 tabular-nums">
                <Star
                  className="h-4 w-4 text-amber-500"
                  fill="currentColor"
                  aria-hidden="true"
                />
                <span className="font-semibold">{place.rating.toFixed(1)}</span>
                {typeof place.userRatingCount === 'number' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({place.userRatingCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {place.matchReason || place.editorialSummary || place.formattedAddress}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onSelect(place)}
              className="min-h-[40px] rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Details & Hours
            </button>
            <button
              type="button"
              onClick={() => onDirections(place)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              Directions
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
