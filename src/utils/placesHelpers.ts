import type { DiscoveredPlace, LatLngPoint, TastePreference } from '../types';

export function computeHaversineMeters(a: LatLngPoint, b: LatLngPoint): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceLabel(meters?: number): string {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return '';
  const miles = meters / 1609.344;
  if (miles < 0.1) {
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatPriceLevel(priceLevel?: string | null): string {
  switch (priceLevel) {
    case 'FREE':
      return 'Free';
    case 'INEXPENSIVE':
      return '$';
    case 'MODERATE':
      return '$$';
    case 'EXPENSIVE':
      return '$$$';
    case 'VERY_EXPENSIVE':
      return '$$$$';
    default:
      return '';
  }
}

export function formatDurationLabel(durationMillis: number): string {
  const mins = Math.max(1, Math.round(durationMillis / 60000));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const text =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);
  const upper = text.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('OVERQUOTAMAPERROR') ||
    upper.includes('QUOTA') ||
    upper.includes('429')
  );
}

export function mapSdkPlaceToDiscovered(
  place: google.maps.places.Place,
  origin: LatLngPoint
): DiscoveredPlace | null {
  const loc = place.location;
  if (!loc) return null;

  const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
  const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const coords: LatLngPoint = { lat, lng };
  const distanceMeters = computeHaversineMeters(origin, coords);

  let photoInfo: DiscoveredPlace['photo'];
  if (place.photos && place.photos.length > 0) {
    try {
      const firstPhoto = place.photos[0];
      const uri = firstPhoto.getURI({ maxWidth: 640, maxHeight: 480 });
      const attr = firstPhoto.authorAttributions?.[0];
      photoInfo = {
        uri,
        attributionName: attr?.displayName ?? undefined,
        attributionUri: attr?.uri ?? undefined,
      };
    } catch {
      photoInfo = undefined;
    }
  }

  let isOpen: boolean | null = null;
  try {
    if (typeof (place as unknown as { isOpen?: () => Promise<boolean | undefined> }).isOpen === 'function') {
      isOpen = null;
    }
    const hours = place.regularOpeningHours as
      | (google.maps.places.OpeningHours & { openNow?: boolean })
      | undefined;
    if (hours && typeof hours.openNow === 'boolean') {
      isOpen = hours.openNow;
    }
  } catch {
    isOpen = null;
  }

  return {
    id: place.id,
    displayName: place.displayName || 'Local Business',
    formattedAddress: place.formattedAddress || 'Address available on map',
    location: coords,
    primaryType: place.primaryType ?? undefined,
    primaryTypeDisplayName: place.primaryTypeDisplayName ?? undefined,
    types: place.types ?? undefined,
    rating: typeof place.rating === 'number' ? place.rating : undefined,
    userRatingCount:
      typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
    priceLevel: place.priceLevel ? String(place.priceLevel) : undefined,
    isOpen,
    businessStatus: place.businessStatus ? String(place.businessStatus) : undefined,
    googleMapsURI: place.googleMapsURI ?? undefined,
    editorialSummary: place.editorialSummary ?? undefined,
    photo: photoInfo,
    distanceMeters,
    rawPlace: place,
    detailsLoaded: false,
  };
}

export function buildTasteHintText(tastes: TastePreference[]): string {
  if (tastes.length === 0) return '';
  const map: Record<TastePreference, string> = {
    cozy: 'cozy quiet',
    family: 'family friendly',
    budget: 'affordable',
    accessible: 'accessible',
    quick: 'quick',
    top_rated: 'popular top rated',
  };
  return tastes.map((t) => map[t]).join(' ');
}
