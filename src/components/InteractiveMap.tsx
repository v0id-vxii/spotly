import React, { useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { RefreshCw, ShoppingBag, Utensils, X } from 'lucide-react';
import type {
  DiscoveredPlace,
  LatLngPoint,
  RouteSummary,
  ThemeMode,
  TravelModeOption,
} from '../types';
import { formatDistanceLabel, formatDurationLabel, isQuotaError } from '../utils/placesHelpers';

interface InteractiveMapProps {
  theme: ThemeMode;
  center: LatLngPoint;
  places: DiscoveredPlace[];
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  onSelectPlace: (place: DiscoveredPlace) => void;
  onHoverPlace: (id: string | null) => void;
  routeTarget: DiscoveredPlace | null;
  travelMode: TravelModeOption;
  onRouteComputed: (summary: RouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
  onClearRoute: () => void;
  onSearchArea: (newCenter: LatLngPoint) => void;
}

interface RouteOverlayProps {
  origin: LatLngPoint;
  destination: DiscoveredPlace;
  travelMode: TravelModeOption;
  onRouteComputed: (summary: RouteSummary | null) => void;
  onRouteError: (msg: string | null) => void;
}

const RouteOverlay: React.FC<RouteOverlayProps> = ({
  origin,
  destination,
  travelMode,
  onRouteComputed,
  onRouteError,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !routesLib || !destination) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteError(null);

    let cancelled = false;

    const request = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: {
        lat: destination.location.lat,
        lng: destination.location.lng,
      },
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    const RouteClass = routesLib.Route as unknown as {
      computeRoutes: (req: unknown) => Promise<{
        routes?: Array<{
          distanceMeters?: number;
          durationMillis?: number;
          viewport?: google.maps.LatLngBounds;
          createPolylines: () => google.maps.Polyline[];
        }>;
      }>;
    };

    RouteClass.computeRoutes(request)
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res.routes?.[0];
        if (!primaryRoute) {
          onRouteComputed(null);
          onRouteError('No route found between these locations.');
          return;
        }

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((poly) => {
          poly.setOptions({
            strokeColor: '#E11D48',
            strokeOpacity: 0.9,
            strokeWeight: 6,
          });
          poly.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 60);
        }

        onRouteComputed({
          destinationId: destination.id,
          destinationName: destination.displayName,
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
          travelMode,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteComputed(null);
        onRouteError('Unable to calculate route right now. Please try again.');
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin, destination, travelMode, onRouteComputed, onRouteError]);

  return null;
};

interface MapCameraSyncProps {
  center: LatLngPoint;
  selectedPlace: DiscoveredPlace | null;
  hasActiveRoute: boolean;
  onMovedAway: (newCenter: LatLngPoint | null) => void;
}

const MapCameraSync: React.FC<MapCameraSyncProps> = ({
  center,
  selectedPlace,
  hasActiveRoute,
  onMovedAway,
}) => {
  const map = useMap();
  const lastProgrammaticCenterRef = useRef<LatLngPoint>(center);

  useEffect(() => {
    if (!map) return;
    lastProgrammaticCenterRef.current = center;
    map.panTo(center);
    onMovedAway(null);
  }, [map, center, onMovedAway]);

  useEffect(() => {
    if (!map || !selectedPlace || hasActiveRoute) return;
    map.panTo(selectedPlace.location);
  }, [map, selectedPlace, hasActiveRoute]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      const current = map.getCenter();
      if (!current) return;
      const cLat = current.lat();
      const cLng = current.lng();
      const deltaLat = Math.abs(cLat - lastProgrammaticCenterRef.current.lat);
      const deltaLng = Math.abs(cLng - lastProgrammaticCenterRef.current.lng);
      if (deltaLat > 0.008 || deltaLng > 0.008) {
        onMovedAway({ lat: cLat, lng: cLng });
      } else {
        onMovedAway(null);
      }
    });
    return () => listener.remove();
  }, [map, onMovedAway]);

  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  theme,
  center,
  places,
  selectedPlaceId,
  hoveredPlaceId,
  onSelectPlace,
  onHoverPlace,
  routeTarget,
  travelMode,
  onRouteComputed,
  onRouteError,
  onClearRoute,
  onSearchArea,
}) => {
  const [movedCenter, setMovedCenter] = useState<LatLngPoint | null>(null);
  const [activeRouteSummary, setActiveRouteSummary] = useState<RouteSummary | null>(
    null
  );

  const selectedPlace =
    places.find((p) => p.id === selectedPlaceId) ?? null;

  const handleRouteResult = (summary: RouteSummary | null) => {
    setActiveRouteSummary(summary);
    onRouteComputed(summary);
  };

  useEffect(() => {
    if (!routeTarget) {
      setActiveRouteSummary(null);
    }
  }, [routeTarget]);

  return (
    <div className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 lg:h-[680px]">
      <GoogleMap
        defaultCenter={center}
        defaultZoom={14}
        mapId="DEMO_MAP_ID"
        colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="h-full w-full"
        onClick={() => {
          setMovedCenter(null);
        }}
      >
        <MapCameraSync
          center={center}
          selectedPlace={selectedPlace}
          hasActiveRoute={Boolean(routeTarget)}
          onMovedAway={setMovedCenter}
        />

        <AdvancedMarker position={center} title="Search Center" zIndex={10}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-sky-600 shadow-md">
            <span className="h-2 w-2 rounded-full bg-white" />
          </div>
        </AdvancedMarker>

        {places.map((place, index) => {
          const isSelected = place.id === selectedPlaceId;
          const isHovered = place.id === hoveredPlaceId;
          const isFood =
            place.primaryType?.includes('restaurant') ||
            place.primaryType?.includes('cafe') ||
            place.primaryType?.includes('bakery');

          return (
            <AdvancedMarker
              key={place.id}
              position={place.location}
              title={place.displayName}
              zIndex={isSelected ? 100 : isHovered ? 80 : 20 + index}
              onClick={() => onSelectPlace(place)}
            >
              <div
                onMouseEnter={() => onHoverPlace(place.id)}
                onMouseLeave={() => onHoverPlace(null)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-md transition-transform duration-150 cursor-pointer ${
                  isSelected
                    ? 'scale-110 border-white bg-rose-600 text-white'
                    : isHovered
                      ? 'scale-105 border-rose-500 bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'border-slate-200 bg-white text-slate-900 hover:scale-105 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                }`}
              >
                {isFood ? (
                  <Utensils className="h-3 w-3 shrink-0" aria-hidden="true" />
                ) : (
                  <ShoppingBag className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <span className="tabular-nums">{index + 1}</span>
              </div>
            </AdvancedMarker>
          );
        })}

        {routeTarget && (
          <RouteOverlay
            origin={center}
            destination={routeTarget}
            travelMode={travelMode}
            onRouteComputed={handleRouteResult}
            onRouteError={onRouteError}
          />
        )}
      </GoogleMap>

      {movedCenter && !routeTarget && (
        <div className="pointer-events-none absolute top-4 left-0 right-0 flex justify-center px-4">
          <button
            type="button"
            onClick={() => {
              const target = movedCenter;
              setMovedCenter(null);
              onSearchArea(target);
            }}
            className="pointer-events-auto inline-flex min-h-[42px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-md hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            Search This Area
          </button>
        </div>
      )}

      {activeRouteSummary && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Active Route · {activeRouteSummary.travelMode}
              </p>
              <p className="mt-0.5 truncate font-display text-sm font-bold text-slate-950 dark:text-white">
                {activeRouteSummary.destinationName}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {formatDurationLabel(activeRouteSummary.durationMillis)} ·{' '}
                {formatDistanceLabel(activeRouteSummary.distanceMeters)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearRoute}
              aria-label="Clear route"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
