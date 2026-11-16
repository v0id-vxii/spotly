export type ThemeMode = 'light' | 'dark';

export type CategoryFilter =
  | 'all'
  | 'restaurant'
  | 'cafe'
  | 'shopping'
  | 'grocery'
  | 'essential';

export type TastePreference =
  | 'cozy'
  | 'family'
  | 'budget'
  | 'accessible'
  | 'quick'
  | 'top_rated';

export type TravelModeOption = 'WALKING' | 'DRIVING' | 'TRANSIT';

export type MobileTab = 'discover' | 'map' | 'perks' | 'saved';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface PlaceLocationState extends LatLngPoint {
  label: string;
}

export interface PlacePhotoInfo {
  uri: string;
  attributionName?: string;
  attributionUri?: string;
}

export interface PlaceReviewInfo {
  authorName: string;
  rating?: number;
  text?: string;
  relativePublishTime?: string;
}

export interface DiscoveredPlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: LatLngPoint;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  isOpen?: boolean | null;
  businessStatus?: string;
  googleMapsURI?: string;
  editorialSummary?: string;
  websiteURI?: string;
  nationalPhoneNumber?: string;
  weekdayDescriptions?: string[];
  wheelchairAccessibleEntrance?: boolean;
  photo?: PlacePhotoInfo;
  reviews?: PlaceReviewInfo[];
  distanceMeters?: number;
  matchScore?: number;
  matchReason?: string;
  rawPlace?: google.maps.places.Place;
  detailsLoaded?: boolean;
}

export interface PartnerPerk {
  id: string;
  businessName: string;
  category: 'restaurant' | 'cafe' | 'shopping' | 'grocery';
  neighborhood: string;
  perkHeadline: string;
  description: string;
  promoCode: string;
  validUntil: string;
  tier: 'Neighborhood Spotlight' | 'Featured Perk Plus';
  imageUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface RouteSummary {
  destinationId: string;
  destinationName: string;
  distanceMeters: number;
  durationMillis: number;
  travelMode: TravelModeOption;
}

export const TASTE_OPTIONS: { id: TastePreference; label: string; queryHint: string }[] = [
  { id: 'cozy', label: 'Cozy & Quiet', queryHint: 'quiet cozy atmosphere' },
  { id: 'family', label: 'Family Friendly', queryHint: 'family friendly seating' },
  { id: 'budget', label: 'Great Value', queryHint: 'affordable casual' },
  { id: 'accessible', label: 'Easy Access', queryHint: 'wheelchair accessible easy entry' },
  { id: 'quick', label: 'Quick Stop', queryHint: 'fast takeout convenient' },
  { id: 'top_rated', label: 'Local Favorites', queryHint: 'top rated popular local' },
];

export const CATEGORY_OPTIONS: {
  id: CategoryFilter;
  label: string;
  includedPrimaryTypes: string[];
  textFallback: string;
}[] = [
  {
    id: 'all',
    label: 'All Spots',
    includedPrimaryTypes: ['restaurant', 'cafe', 'bakery', 'store', 'supermarket'],
    textFallback: 'popular restaurants cafes and local shops',
  },
  {
    id: 'restaurant',
    label: 'Restaurants',
    includedPrimaryTypes: ['restaurant'],
    textFallback: 'restaurants dining',
  },
  {
    id: 'cafe',
    label: 'Cafes & Bakeries',
    includedPrimaryTypes: ['cafe', 'bakery', 'coffee_shop'],
    textFallback: 'cafes coffee shops and bakeries',
  },
  {
    id: 'shopping',
    label: 'Shops & Boutiques',
    includedPrimaryTypes: ['store', 'book_store', 'clothing_store', 'gift_shop'],
    textFallback: 'local boutiques bookstores and shops',
  },
  {
    id: 'grocery',
    label: 'Groceries',
    includedPrimaryTypes: ['grocery_store', 'supermarket', 'market'],
    textFallback: 'grocery stores and local food markets',
  },
  {
    id: 'essential',
    label: 'Pharmacies & Care',
    includedPrimaryTypes: ['pharmacy', 'drugstore'],
    textFallback: 'pharmacies and everyday essentials',
  },
];

export const PRESET_NEIGHBORHOODS: PlaceLocationState[] = [
  { lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA' },
  { lat: 40.7306, lng: -73.9866, label: 'East Village, New York' },
  { lat: 51.5136, lng: -0.1365, label: 'Soho, London' },
  { lat: 41.8902, lng: -87.6244, label: 'River North, Chicago' },
];
