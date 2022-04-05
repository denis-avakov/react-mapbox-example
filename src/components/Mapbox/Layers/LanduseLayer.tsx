import { Layer } from 'react-map-gl';
import type { LayerProps } from 'react-map-gl';

type LanduseLayer = {};

export default function LanduseLayer(props: LanduseLayer) {
  return (
    <Layer
      {...({
        'id': 'mapbox-landuse',
        'type': 'line',
        'source': 'composite',
        'source-layer': 'landuse',
        'paint': {
          'line-color': '#4b5563',
          'line-width': 1
        },
        'filter': ['in', 'type', 'residential']
      } as LayerProps)}
    />
  );
}
