import React, { useEffect, useState } from 'react';
import {
  Accessibility,
  Bookmark,
  Car,
  Clock,
  ExternalLink,
  Footprints,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Star,
  Train,
  X,
} from 'lucide-react';
import type {
  DiscoveredPlace,
  RouteSummary,
  TravelModeOption,
} from '../types';
import {
  formatDistanceLabel,
  formatDurationLabel,
  formatPriceLevel,
  isQuotaError,
} from '../utils/placesHelpers';

interface PlaceDetailDrawerProps {
  place: DiscoveredPlace | null;
  isSaved: boolean;
  travelMode: TravelModeOption;
  routeSummary: RouteSummary | null;
  routeError: string | null;
  isRoutingActive: boolean;
  onClose: () => void;
  onToggleSave: (place: DiscoveredPlace) => void;
  onStartDirections: (place: DiscoveredPlace, mode: TravelModeOption) => void;
  onChangeTravelMode: (mode: TravelModeOption) => void;
  onPlaceEnriched: (updated: DiscoveredPlace) => void;
}

export const PlaceDetailDrawer: React.FC<PlaceDetailDrawerProps> = ({
  place,
  isSaved,
  travelMode,
  routeSummary,
  routeError,
  isRoutingActive,
  onClose,
  onToggleSave,
  onStartDirections,
  onChangeTravelMode,
  onPlaceEnriched,
}) => {
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!place || place.detailsLoaded || !place.rawPlace) return;

    let cancelled = false;
    setLoadingDetails(true);

    place.rawPlace
      .fetchFields({
        fields: [
          'editorialSummary',
          'regularOpeningHours',
          'nationalPhoneNumber',
          'websiteURI',
          'photos',
          'reviews',
          'accessibilityOptions',
          'googleMapsURI',
        ],
      })
      .then(() => {
        if (cancelled) return;
        const sdk = place.rawPlace!;
        let photoInfo = place.photo;
        if (!photoInfo && sdk.photos && sdk.photos.length > 0) {
          const p0 = sdk.photos[0];
          const attr = p0.authorAttributions?.[0];
          photoInfo = {
            uri: p0.getURI({ maxWidth: 800, maxHeight: 540 }),
            attributionName: attr?.displayName ?? undefined,
            attributionUri: attr?.uri ?? undefined,
          };
        }

        const reviews = (sdk.reviews ?? []).slice(0, 3).map((r) => ({
          authorName: r.authorAttribution?.displayName || 'Local Visitor',
          rating: typeof r.rating === 'number' ? r.rating : undefined,
          text: r.text ?? undefined,
          relativePublishTime: r.relativePublishTimeDescription ?? undefined,
        }));

        const accessibilityOptions = sdk.accessibilityOptions as
          | { hasWheelchairAccessibleEntrance?: boolean }
          | undefined;

        onPlaceEnriched({
          ...place,
          editorialSummary: sdk.editorialSummary ?? place.editorialSummary,
          nationalPhoneNumber: sdk.nationalPhoneNumber ?? undefined,
          websiteURI: sdk.websiteURI ?? undefined,
          googleMapsURI: sdk.googleMapsURI ?? place.googleMapsURI,
          weekdayDescriptions:
            sdk.regularOpeningHours?.weekdayDescriptions ?? undefined,
          wheelchairAccessibleEntrance:
            accessibilityOptions?.hasWheelchairAccessibleEntrance,
          photo: photoInfo,
          reviews,
          detailsLoaded: true,
        });
      })
      .catch((err: unknown) => {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [place, onPlaceEnriched]);

  if (!place) return null;

  const priceText = formatPriceLevel(place.priceLevel);
  const distanceText = formatDistanceLabel(place.distanceMeters);
  const categoryText =
    place.primaryTypeDisplayName ||
    (place.primaryType ? place.primaryType.replace(/_/g, ' ') : 'Local Business');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-drawer-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] sm:max-h-full w-full sm:max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-none sm:rounded-l-3xl border-t sm:border-t-0 sm:border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-medium capitalize text-rose-600 dark:text-rose-400">
              {categoryText}
              {priceText ? ` · ${priceText}` : ''}
              {distanceText ? ` · ${distanceText}` : ''}
            </p>
            <h2
              id="place-drawer-title"
              className="mt-1 font-display text-xl font-bold text-slate-950 dark:text-white"
            >
              {place.displayName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close place details"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {place.photo?.uri && (
            <div>
              <div className="h-52 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                <img
                  src={place.photo.uri}
                  alt={place.displayName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              {place.photo.attributionName && (
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Photo credit: {place.photo.attributionName}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300 tabular-nums">
            {typeof place.rating === 'number' && (
              <div className="flex items-center gap-1.5 font-semibold text-slate-950 dark:text-white">
                <Star className="h-4 w-4 text-amber-500" fill="currentColor" aria-hidden="true" />
                <span>{place.rating.toFixed(1)}</span>
                {typeof place.userRatingCount === 'number' && (
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    ({place.userRatingCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
            {place.isOpen !== null && place.isOpen !== undefined && (
              <span
                className={
                  place.isOpen
                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }
              >
                {place.isOpen ? 'Open Now' : 'Currently Closed'}
              </span>
            )}
            {place.wheelchairAccessibleEntrance && (
              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <Accessibility className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                Step-free entrance
              </span>
            )}
          </div>

          {(place.matchReason || place.editorialSummary) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              {place.matchReason && (
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {place.matchReason}
                </p>
              )}
              {place.editorialSummary && (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {place.editorialSummary}
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                Plan Your Visit
              </h3>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(
                  [
                    { id: 'WALKING', label: 'Walk', Icon: Footprints },
                    { id: 'DRIVING', label: 'Drive', Icon: Car },
                    { id: 'TRANSIT', label: 'Transit', Icon: Train },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeTravelMode(id)}
                    className={`flex min-h-[34px] items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      travelMode === id
                        ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {isRoutingActive && routeSummary?.destinationId === place.id && (
              <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                Route ready: {formatDurationLabel(routeSummary.durationMillis)} ·{' '}
                {formatDistanceLabel(routeSummary.distanceMeters)}
              </p>
            )}
            {routeError && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                {routeError}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onStartDirections(place, travelMode)}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Show Route on Map
              </button>

              <button
                type="button"
                onClick={() => onToggleSave(place)}
                aria-pressed={isSaved}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  isSaved
                    ? 'border-rose-600 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-950/50 dark:text-rose-200'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark
                  className="h-4 w-4"
                  fill={isSaved ? 'currentColor' : 'none'}
                />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{place.formattedAddress}</span>
            </div>

            {place.nationalPhoneNumber && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a
                  href={`tel:${place.nationalPhoneNumber}`}
                  className="font-medium text-slate-900 hover:underline dark:text-white"
                >
                  {place.nationalPhoneNumber}
                </a>
              </div>
            )}

            {place.websiteURI && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a
                  href={place.websiteURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-medium text-rose-600 hover:underline dark:text-rose-400"
                >
                  Visit Business Website
                </a>
              </div>
            )}

            {place.googleMapsURI && (
              <div className="flex items-center gap-3">
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a
                  href={place.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 hover:underline dark:text-white"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

          {loadingDetails && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loading hours and visitor reviews...
            </p>
          )}

          {place.weekdayDescriptions && place.weekdayDescriptions.length > 0 && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-slate-950 dark:text-white">
                <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Opening Hours
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                {place.weekdayDescriptions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {place.reviews && place.reviews.length > 0 && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                Recent Visitor Notes
              </h3>
              <div className="mt-3 space-y-3">
                {place.reviews.map((rev, idx) => (
                  <div
                    key={`${rev.authorName}-${idx}`}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {rev.authorName}
                      </span>
                      <span className="tabular-nums">
                        {typeof rev.rating === 'number' ? `${rev.rating}/5` : ''}
                        {rev.relativePublishTime ? ` · ${rev.relativePublishTime}` : ''}
                      </span>
                    </div>
                    {rev.text && (
                      <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 line-clamp-4">
                        {rev.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
