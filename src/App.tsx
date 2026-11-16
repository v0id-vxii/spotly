import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { ArrowUpDown, Compass, RotateCcw } from 'lucide-react';
import { DiscoveryControls } from './components/DiscoveryControls';
import { InteractiveMap } from './components/InteractiveMap';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PartnerSpotlightModal } from './components/PartnerSpotlightModal';
import { PerksAndSpotlightSection } from './components/PerksAndSpotlightSection';
import { PlaceCard } from './components/PlaceCard';
import { PlaceDetailDrawer } from './components/PlaceDetailDrawer';
import { SavedSpotsSection } from './components/SavedSpotsSection';
import { SpotlyLogo } from './components/SpotlyLogo';
import { TopBar } from './components/TopBar';
import {
  CATEGORY_OPTIONS,
  PRESET_NEIGHBORHOODS,
  type CategoryFilter,
  type DiscoveredPlace,
  type LatLngPoint,
  type MobileTab,
  type PartnerPerk,
  type PlaceLocationState,
  type RouteSummary,
  type TastePreference,
  type ThemeMode,
  type TravelModeOption,
} from './types';
import {
  buildTasteHintText,
  isQuotaError,
  mapSdkPlaceToDiscovered,
} from './utils/placesHelpers';

const STORAGE_KEYS = {
  theme: 'spotly_theme',
  easyRead: 'spotly_easy_read',
  saved: 'spotly_saved_places',
  claimedPerks: 'spotly_claimed_perks',
  tastes: 'spotly_tastes',
};

function readInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'dark' || saved === 'light') return saved;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // ignore storage errors
  }
  return 'light';
}

function readInitialBoolean(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function readInitialJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface WorkspaceProps {
  theme: ThemeMode;
  onToggleTheme: (next: ThemeMode) => void;
  easyRead: boolean;
  onToggleEasyRead: () => void;
  mapsReady: boolean;
}

const SpotlyWorkspace: React.FC<WorkspaceProps> = ({
  theme,
  onToggleTheme,
  easyRead,
  onToggleEasyRead,
  mapsReady,
}) => {
  const placesLib = useMapsLibrary('places');

  const [location, setLocation] = useState<PlaceLocationState>(
    PRESET_NEIGHBORHOODS[0]
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedTastes, setSelectedTastes] = useState<TastePreference[]>(() =>
    readInitialJson<TastePreference[]>(STORAGE_KEYS.tastes, [])
  );
  const [sortBy, setSortBy] = useState<'match' | 'distance' | 'rating'>('match');

  const [places, setPlaces] = useState<DiscoveredPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<DiscoveredPlace | null>(
    null
  );
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  const [routeTarget, setRouteTarget] = useState<DiscoveredPlace | null>(null);
  const [travelMode, setTravelMode] = useState<TravelModeOption>('WALKING');
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [savedPlaces, setSavedPlaces] = useState<DiscoveredPlace[]>(() =>
    readInitialJson<DiscoveredPlace[]>(STORAGE_KEYS.saved, [])
  );
  const [perks, setPerks] = useState<PartnerPerk[]>([]);
  const [claimedPerkIds, setClaimedPerkIds] = useState<string[]>(() =>
    readInitialJson<string[]>(STORAGE_KEYS.claimedPerks, [])
  );

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('discover');
  const [toast, setToast] = useState<string | null>(null);

  const searchRequestSeqRef = useRef(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 2800);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.tastes, JSON.stringify(selectedTastes));
    } catch {
      // ignore
    }
  }, [selectedTastes]);

  useEffect(() => {
    try {
      const serializable = savedPlaces.map((p) => ({
        ...p,
        rawPlace: undefined,
      }));
      localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(serializable));
    } catch {
      // ignore
    }
  }, [savedPlaces]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.claimedPerks,
        JSON.stringify(claimedPerkIds)
      );
    } catch {
      // ignore
    }
  }, [claimedPerkIds]);

  useEffect(() => {
    fetch('/api/perks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.perks)) {
          setPerks(data.perks);
        }
      })
      .catch(() => {
        // ignore transient error
      });
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationNotice(
        'Geolocation is not supported in this browser. Pick a neighborhood above.'
      );
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Current Area',
        });
        setLocationNotice('Showing live spots closest to your current location.');
        setIsLocating(false);
      },
      () => {
        setLocationNotice(
          `Location access was not granted—exploring ${location.label} instead.`
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 7000 }
    );
  }, [location.label]);

  const runDiscoverySearch = useCallback(async () => {
    if (!placesLib) return;

    const seq = ++searchRequestSeqRef.current;
    setIsSearching(true);
    setSearchError(null);

    const categoryMeta =
      CATEGORY_OPTIONS.find((c) => c.id === category) ?? CATEGORY_OPTIONS[0];
    const tasteText = buildTasteHintText(selectedTastes);
    const trimmedQuery = submittedQuery.trim();

    const baseFields = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'primaryType',
      'primaryTypeDisplayName',
      'rating',
      'userRatingCount',
      'priceLevel',
      'regularOpeningHours',
      'businessStatus',
      'googleMapsURI',
      'photos',
    ];

    try {
      let sdkPlaces: google.maps.places.Place[] = [];

      const shouldUseTextSearch =
        Boolean(trimmedQuery) || openNowOnly || selectedTastes.length > 0;

      if (shouldUseTextSearch) {
        const composedQuery = [
          trimmedQuery || categoryMeta.textFallback,
          tasteText,
        ]
          .filter(Boolean)
          .join(' ');

        const request: google.maps.places.SearchByTextRequest & {
          internalUsageAttributionIds?: string[];
        } = {
          textQuery: composedQuery,
          fields: baseFields,
          locationBias: {
            center: { lat: location.lat, lng: location.lng },
            radius: 3500,
          },
          maxResultCount: 15,
          language: 'en-US',
          region: 'us',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        };

        if (category !== 'all' && categoryMeta.includedPrimaryTypes.length === 1) {
          request.includedType = categoryMeta.includedPrimaryTypes[0];
        }
        if (openNowOnly) {
          request.isOpenNow = true;
        }

        const res = await placesLib.Place.searchByText(request);
        sdkPlaces = res.places ?? [];
      } else {
        const request: google.maps.places.SearchNearbyRequest & {
          internalUsageAttributionIds?: string[];
        } = {
          fields: baseFields,
          locationRestriction: {
            center: { lat: location.lat, lng: location.lng },
            radius: 2800,
          },
          includedPrimaryTypes: categoryMeta.includedPrimaryTypes,
          maxResultCount: 15,
          rankPreference: placesLib.SearchNearbyRankPreference.POPULARITY,
          language: 'en-US',
          region: 'us',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        };

        const res = await placesLib.Place.searchNearby(request);
        sdkPlaces = res.places ?? [];
      }

      if (seq !== searchRequestSeqRef.current) return;

      const mapped = sdkPlaces
        .map((p) => mapSdkPlaceToDiscovered(p, location))
        .filter((p): p is DiscoveredPlace => p !== null);

      setPlaces(mapped);
      setIsSearching(false);

      if (mapped.length > 0) {
        const compactPayload = mapped.map((p) => ({
          id: p.id,
          name: p.displayName,
          category: p.primaryTypeDisplayName || p.primaryType || 'Local business',
          rating: p.rating ?? null,
          userRatingCount: p.userRatingCount ?? null,
          priceLevel: p.priceLevel ?? null,
          isOpen: p.isOpen ?? null,
          address: p.formattedAddress,
          distanceMeters: Math.round(p.distanceMeters ?? 0),
        }));

        fetch('/api/personalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            places: compactPayload,
            tastes: selectedTastes,
            query: trimmedQuery,
            locationLabel: location.label,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (seq !== searchRequestSeqRef.current) return;
            if (!Array.isArray(data.matches)) return;
            const matchById: Record<
              string,
              { matchScore: number; matchReason: string }
            > = {};
            for (const m of data.matches) {
              if (m?.id) {
                matchById[m.id] = {
                  matchScore: Number(m.matchScore) || 75,
                  matchReason: String(m.matchReason || ''),
                };
              }
            }
            setPlaces((prev) =>
              prev.map((item) => {
                const match = matchById[item.id];
                return match
                  ? {
                      ...item,
                      matchScore: match.matchScore,
                      matchReason: match.matchReason,
                    }
                  : item;
              })
            );
          })
          .catch(() => {
            // keep Places data cleanly without AI overlay if offline
          });
      }
    } catch (err) {
      if (seq !== searchRequestSeqRef.current) return;
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        setSearchError(
          'Live map search quota reached. You can still browse your saved spots and local perks below.'
        );
      } else {
        setSearchError(
          'Unable to load nearby spots right now. Try adjusting your search or neighborhood.'
        );
      }
      setPlaces([]);
      setIsSearching(false);
    }
  }, [placesLib, location, category, openNowOnly, selectedTastes, submittedQuery]);

  useEffect(() => {
    if (placesLib) {
      void runDiscoverySearch();
    }
  }, [placesLib, runDiscoverySearch]);

  const sortedPlaces = useMemo(() => {
    const copy = [...places];
    if (sortBy === 'distance') {
      copy.sort(
        (a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999)
      );
    } else if (sortBy === 'rating') {
      copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else {
      copy.sort(
        (a, b) =>
          (b.matchScore ?? (b.rating ? b.rating * 15 : 50)) -
          (a.matchScore ?? (a.rating ? a.rating * 15 : 50))
      );
    }
    return copy;
  }, [places, sortBy]);

  const savedIdsSet = useMemo(() => {
    const record: Record<string, boolean> = {};
    for (const p of savedPlaces) record[p.id] = true;
    return record;
  }, [savedPlaces]);

  const handleToggleSave = useCallback(
    (place: DiscoveredPlace) => {
      setSavedPlaces((prev) => {
        const exists = prev.some((item) => item.id === place.id);
        if (exists) {
          showToast(`Removed ${place.displayName} from saved.`);
          return prev.filter((item) => item.id !== place.id);
        }
        showToast(`Saved ${place.displayName} to your shortlist.`);
        return [{ ...place, rawPlace: undefined }, ...prev];
      });
    },
    [showToast]
  );

  const handleStartDirections = useCallback(
    (place: DiscoveredPlace, mode?: TravelModeOption) => {
      if (mode) setTravelMode(mode);
      setRouteTarget(place);
      setSelectedPlace(place);
      if (window.innerWidth < 1024) {
        setMobileTab('map');
      }
    },
    []
  );

  const handlePlaceEnriched = useCallback((updated: DiscoveredPlace) => {
    setPlaces((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedPlace((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const handleClaimPerk = useCallback(
    (perk: PartnerPerk) => {
      setClaimedPerkIds((prev) =>
        prev.includes(perk.id) ? prev : [...prev, perk.id]
      );
      showToast(`Perk unlocked: use code ${perk.promoCode}`);
    },
    [showToast]
  );

  const handleNavigateSection = useCallback(
    (sectionId: 'discover' | 'perks' | 'saved' | 'spotlight') => {
      if (sectionId === 'perks') setMobileTab('perks');
      else if (sectionId === 'saved') setMobileTab('saved');
      else setMobileTab('discover');

      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    []
  );

  const handleMobileTabChange = useCallback((tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === 'perks') {
      document.getElementById('perks')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'saved') {
      document.getElementById('saved')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleSearchArea = useCallback((newCenter: LatLngPoint) => {
    setLocation({
      lat: newCenter.lat,
      lng: newCenter.lng,
      label: 'Selected Map Area',
    });
    setLocationNotice('Updated discovery results to match the visible map area.');
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSubmittedQuery('');
    setCategory('all');
    setOpenNowOnly(false);
    setSelectedTastes([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-24 md:pb-12">
      <TopBar
        savedCount={savedPlaces.length}
        onNavigateSection={handleNavigateSection}
        onOpenPartnerModal={() => setPartnerModalOpen(true)}
      />

      <DiscoveryControls
        theme={theme}
        onToggleTheme={onToggleTheme}
        easyRead={easyRead}
        onToggleEasyRead={onToggleEasyRead}
        location={location}
        isLocating={isLocating}
        locationNotice={locationNotice}
        onUseCurrentLocation={handleUseCurrentLocation}
        onSelectLocation={(loc) => {
          setLocation(loc);
          setLocationNotice(null);
          setRouteTarget(null);
          setRouteSummary(null);
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSubmitSearch={(e) => {
          e.preventDefault();
          setSubmittedQuery(searchQuery);
        }}
        onClearSearch={() => {
          setSearchQuery('');
          setSubmittedQuery('');
        }}
        category={category}
        onCategoryChange={setCategory}
        openNowOnly={openNowOnly}
        onToggleOpenNow={() => setOpenNowOnly((prev) => !prev)}
        selectedTastes={selectedTastes}
        onToggleTaste={(taste) =>
          setSelectedTastes((prev) =>
            prev.includes(taste)
              ? prev.filter((t) => t !== taste)
              : [...prev, taste]
          )
        }
        mapsReady={mapsReady}
      />

      <main className="space-y-16 pt-8">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white tabular-nums">
                {isSearching
                  ? 'Finding nearby spots...'
                  : `${sortedPlaces.length} local recommendations`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="sort-select" className="sr-only">
                Sort recommendations
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'match' | 'distance' | 'rating')
                }
                className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="match">Best Match</option>
                <option value="distance">Closest First</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <div
              className={`space-y-3.5 lg:col-span-6 ${
                mobileTab === 'map' ? 'hidden lg:block' : 'block'
              }`}
            >
              {isSearching ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex gap-4">
                      <div className="h-28 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2.5 py-1">
                        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                  </div>
                ))
              ) : searchError ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <Compass className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
                  <p className="mt-3 font-display text-base font-semibold text-slate-950 dark:text-white">
                    {searchError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void runDiscoverySearch()}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Try Again
                  </button>
                </div>
              ) : sortedPlaces.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <Compass className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 font-display text-base font-semibold text-slate-950 dark:text-white">
                    No matching spots found nearby
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Try clearing one of your filters or picking another neighborhood.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                sortedPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isSelected={selectedPlace?.id === place.id}
                    isHovered={hoveredPlaceId === place.id}
                    isSaved={Boolean(savedIdsSet[place.id])}
                    onHover={setHoveredPlaceId}
                    onSelect={setSelectedPlace}
                    onToggleSave={handleToggleSave}
                    onDirections={(p) => handleStartDirections(p, travelMode)}
                  />
                ))
              )}
            </div>

            <div
              className={`lg:sticky lg:top-20 lg:col-span-6 ${
                mobileTab === 'map' ? 'block' : 'hidden lg:block'
              }`}
            >
              {mapsReady ? (
                <InteractiveMap
                  theme={theme}
                  center={location}
                  places={sortedPlaces}
                  selectedPlaceId={selectedPlace?.id ?? null}
                  hoveredPlaceId={hoveredPlaceId}
                  onSelectPlace={setSelectedPlace}
                  onHoverPlace={setHoveredPlaceId}
                  routeTarget={routeTarget}
                  travelMode={travelMode}
                  onRouteComputed={setRouteSummary}
                  onRouteError={setRouteError}
                  onClearRoute={() => {
                    setRouteTarget(null);
                    setRouteSummary(null);
                    setRouteError(null);
                  }}
                  onSearchArea={handleSearchArea}
                />
              ) : (
                <div className="flex h-[440px] lg:h-[680px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Loading interactive neighborhood map...
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <PerksAndSpotlightSection
          perks={perks}
          claimedPerkIds={claimedPerkIds}
          onClaimPerk={handleClaimPerk}
          onOpenPartnerModal={() => setPartnerModalOpen(true)}
        />

        <SavedSpotsSection
          savedPlaces={savedPlaces}
          onSelectPlace={setSelectedPlace}
          onRemoveSaved={(id) =>
            setSavedPlaces((prev) => prev.filter((item) => item.id !== id))
          }
          onDirections={(p) => handleStartDirections(p, travelMode)}
        />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SpotlyLogo size="sm" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Effortless neighborhood discovery for every generation.
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Map data &amp; business hours powered by Google Maps Platform.
          </p>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={mobileTab}
        savedCount={savedPlaces.length}
        onSelectTab={handleMobileTabChange}
      />

      <PlaceDetailDrawer
        place={selectedPlace}
        isSaved={Boolean(selectedPlace && savedIdsSet[selectedPlace.id])}
        travelMode={travelMode}
        routeSummary={routeSummary}
        routeError={routeError}
        isRoutingActive={Boolean(routeTarget)}
        onClose={() => setSelectedPlace(null)}
        onToggleSave={handleToggleSave}
        onStartDirections={(p, mode) => handleStartDirections(p, mode)}
        onChangeTravelMode={(mode) => {
          setTravelMode(mode);
          if (routeTarget && selectedPlace) {
            setRouteTarget(selectedPlace);
          }
        }}
        onPlaceEnriched={handlePlaceEnriched}
      />

      <PartnerSpotlightModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        onPartnerCreated={(updatedPerks) => {
          setPerks(updatedPerks);
          showToast('Your Partner Spotlight perk is now live!');
        }}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-950"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [easyRead, setEasyRead] = useState<boolean>(() =>
    readInitialBoolean(STORAGE_KEYS.easyRead)
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const envApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [mapsApiKey, setMapsApiKey] = useState<string>(envApiKey);
  const [configLoaded, setConfigLoaded] = useState<boolean>(Boolean(envApiKey));

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  useEffect(() => {
    if (envApiKey) return;
    fetch('/api/maps-config')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.apiKey === 'string' && data.apiKey.trim()) {
          setMapsApiKey(data.apiKey.trim());
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setConfigLoaded(true));
  }, [envApiKey]);

  const handleToggleTheme = useCallback((next: ThemeMode) => {
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch {
      // ignore
    }
  }, []);

  const handleToggleEasyRead = useCallback(() => {
    setEasyRead((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('easy-read', next);
      try {
        localStorage.setItem(STORAGE_KEYS.easyRead, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const quotaBanner = quotaExceeded ? (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  ) : null;

  if (!configLoaded) {
    return (
      <>
        {quotaBanner}
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <p className="text-sm font-medium">Loading Spotly...</p>
        </div>
      </>
    );
  }

  if (!mapsApiKey) {
    return (
      <>
        {quotaBanner}
        <SpotlyWorkspace
          theme={theme}
          onToggleTheme={handleToggleTheme}
          easyRead={easyRead}
          onToggleEasyRead={handleToggleEasyRead}
          mapsReady={false}
        />
      </>
    );
  }

  return (
    <>
      {quotaBanner}
      <APIProvider
        apiKey={mapsApiKey}
        language="en"
        region="US"
      >
        <SpotlyWorkspace
          theme={theme}
          onToggleTheme={handleToggleTheme}
          easyRead={easyRead}
          onToggleEasyRead={handleToggleEasyRead}
          mapsReady={true}
        />
      </APIProvider>
    </>
  );
}
