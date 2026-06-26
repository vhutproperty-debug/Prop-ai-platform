import type {
  PoiConfidenceLevel,
  PoiEntityType,
  PoiSource,
  PoiType,
} from "@/config/location-intelligence";

export interface NearbyPlaceRecord {
  _id: string;
  entityType: PoiEntityType;
  entityId: string;
  projectId?: string;
  locationId?: string;
  type: PoiType;
  name: string;
  slug: string;
  distanceMeters?: number;
  distanceLabel?: string;
  travelTimeMinutes?: number;
  travelTimeLabel?: string;
  latitude?: number;
  longitude?: number;
  source: PoiSource;
  confidence: PoiConfidenceLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyPlaceInput {
  entityType: PoiEntityType;
  entityId: string;
  type: PoiType;
  name: string;
  slug?: string;
  distanceMeters?: number;
  distanceLabel?: string;
  travelTimeMinutes?: number;
  travelTimeLabel?: string;
  latitude?: number;
  longitude?: number;
  source?: PoiSource;
  confidence?: PoiConfidenceLevel;
  isActive?: boolean;
}

export interface FirecrawlNearbyPlace {
  type: string;
  name: string;
  distance?: string;
  travelTime?: string;
}

export interface ProjectLocationIntelligence {
  projectId: string;
  locationId?: string;
  places: NearbyPlaceRecord[];
  byType: Record<PoiType, NearbyPlaceRecord[]>;
  dataGaps: PoiType[];
}
