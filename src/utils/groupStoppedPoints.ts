import { VehicleTrackingData } from '@/hooks/useVehicleTracking';

export interface StoppedGroup {
  type: 'stopped-group';
  id: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  pointCount: number;
  points: VehicleTrackingData[];
  ignition: boolean | null;
}

export interface SinglePoint {
  type: 'single-point';
  data: VehicleTrackingData;
}

export type HistoryDisplayItem = SinglePoint | StoppedGroup;

/**
 * Round coordinate to 5 decimal places (~1m precision) to handle minor GPS drift
 */
function roundCoord(value: number): number {
  return Math.round(value * 100000) / 100000;
}

function isStopped(point: VehicleTrackingData): boolean {
  return (point.speed ?? 0) === 0;
}

function sameLocation(a: VehicleTrackingData, b: VehicleTrackingData): boolean {
  return (
    roundCoord(a.latitude) === roundCoord(b.latitude) &&
    roundCoord(a.longitude) === roundCoord(b.longitude)
  );
}

/**
 * Groups consecutive stopped points at the same location into a single item.
 * Moving points are kept as individual items.
 */
export function groupStoppedPoints(points: VehicleTrackingData[]): HistoryDisplayItem[] {
  if (points.length === 0) return [];

  const result: HistoryDisplayItem[] = [];
  let i = 0;

  while (i < points.length) {
    const current = points[i];

    if (!isStopped(current)) {
      result.push({ type: 'single-point', data: current });
      i++;
      continue;
    }

    // Collect consecutive stopped points at the same location
    const group: VehicleTrackingData[] = [current];
    let j = i + 1;
    while (j < points.length && isStopped(points[j]) && sameLocation(current, points[j])) {
      group.push(points[j]);
      j++;
    }

    if (group.length === 1) {
      // Single stopped point, don't group
      result.push({ type: 'single-point', data: current });
    } else {
      const first = group[0];
      const last = group[group.length - 1];
      result.push({
        type: 'stopped-group',
        id: `group-${first.id}-${last.id}`,
        latitude: first.latitude,
        longitude: first.longitude,
        startTime: first.recorded_at || '',
        endTime: last.recorded_at || '',
        pointCount: group.length,
        points: group,
        ignition: first.ignition,
      });
    }

    i = j;
  }

  return result;
}

/**
 * Returns the total number of original points represented by the display items
 */
export function countOriginalPoints(items: HistoryDisplayItem[]): number {
  return items.reduce((acc, item) => {
    return acc + (item.type === 'stopped-group' ? item.pointCount : 1);
  }, 0);
}

/**
 * Flattens display items back to original points (for map rendering)
 */
export function flattenToPoints(items: HistoryDisplayItem[]): VehicleTrackingData[] {
  return items.flatMap(item =>
    item.type === 'stopped-group' ? item.points : [item.data]
  );
}
