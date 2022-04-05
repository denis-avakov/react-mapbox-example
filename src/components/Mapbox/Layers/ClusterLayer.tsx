import { Layer } from 'react-map-gl';
import type { LayerProps } from 'react-map-gl';

export default function ClusterLayer() {
  return (
    <>
      <Layer
        {...({
          id: 'clusters',
          type: 'circle',
          source: 'mapbox-apartments',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#e5e7eb',
            'circle-radius': 20
          }
        } as LayerProps)}
      />

      <Layer
        {...({
          id: 'cluster-count',
          type: 'symbol',
          source: 'mapbox-apartments',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        } as LayerProps)}
      />

      <Layer
        {...({
          id: 'unclustered-point',
          type: 'circle',
          source: 'mapbox-apartments',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#f9fafb',
            'circle-radius': 3,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#9ca3af'
          }
        } as LayerProps)}
      />
    </>
  );
}
