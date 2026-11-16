import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, X } from 'lucide-react';
import type { PlaceLocationState } from '../types';
import { isQuotaError } from '../utils/placesHelpers';

interface LocationAutocompleteProps {
  currentLocationLabel: string;
  onSelectLocation: (loc: PlaceLocationState) => void;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  currentLocationLabel,
  onSelectLocation,
}) => {
  const placesLib = useMapsLibrary('places');
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const res =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken: sessionTokenRef.current!,
          });
        if (!cancelled) {
          setSuggestions(res.suggestions ?? []);
          setIsOpen(true);
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputValue]);

  const handleSelectSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    if (!suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });

      if (place.location) {
        const lat =
          typeof place.location.lat === 'function'
            ? place.location.lat()
            : Number(place.location.lat);
        const lng =
          typeof place.location.lng === 'function'
            ? place.location.lng()
            : Number(place.location.lng);

        onSelectLocation({
          lat,
          lng,
          label:
            place.displayName ||
            place.formattedAddress ||
            suggestion.placePrediction.text.text,
        });
      }
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      sessionTokenRef.current = null;
      setSuggestions([]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <div className="relative flex items-center">
        <MapPin
          className="pointer-events-none absolute left-3 h-4 w-4 text-rose-600 dark:text-rose-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={`Area: ${currentLocationLabel}`}
          aria-label="Change neighborhood or city"
          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            aria-label="Clear location search"
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              Finding neighborhoods...
            </div>
          ) : (
            <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {suggestions.map((item, index) => {
                const label = item.placePrediction?.text.text ?? 'Selected place';
                return (
                  <li key={`${label}-${index}`}>
                    <button
                      type="button"
                      onClick={() => void handleSelectSuggestion(item)}
                      className="flex min-h-[44px] w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
