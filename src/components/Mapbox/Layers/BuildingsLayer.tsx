import { Layer } from 'react-map-gl';
import type { LayerProps } from 'react-map-gl';
import { uniq, toString, compact } from 'lodash';

export default function BuildingsLayer(props: { features: any[] }) {
  const featureIds = compact(props.features.map((feature) => feature.id));

  const filters = uniq(featureIds).map((id: any) => {
    return ['in', ['id'], toString(id)];
  });

  return (
    <Layer
      {...({
        'id': 'mapbox-buildings',
        'type': 'line',
        'source': 'composite',
        'source-layer': 'building',
        'paint': {
          'line-color': '#737373',
          'line-width': 1
        },
        'filter': filters.length ? ['any', ...filters] : ['boolean', false]
      } as LayerProps)}
    />
  );
}
