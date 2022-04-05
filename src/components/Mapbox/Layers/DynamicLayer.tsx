import { useMemo } from 'react';
import { Layer } from 'react-map-gl';
import type { Feature, Polygon } from '@turf/turf';

type DynamicLayerProps = {
  id: string;
  sourceId: string;
  currentHover: string;
  features: Feature<Polygon>[];
};

export default function DynamicLayer(props: DynamicLayerProps) {
  const hoverFilter = useMemo(() => {
    if (props.features.length === 1) {
      return ['boolean', false];
    }

    return ['in', 'id', props.currentHover];
  }, [props.features, props.currentHover]);

  const activeFilter = useMemo(() => {
    if (props.features.length === 1) {
      return ['boolean', true];
    }

    return ['boolean', false];
  }, [props.features]);

  return (
    <>
      <Layer
        id={`${props.id}-body`}
        type="fill"
        source={`mapbox-${props.sourceId}`}
        paint={{
          'fill-color': '#fdba74',
          'fill-opacity': 0.03
        }}
      />

      <Layer
        id={`${props.id}-hover`}
        type="fill"
        source={`mapbox-${props.sourceId}`}
        paint={{
          'fill-color': '#fdba74',
          'fill-opacity': 0.2
        }}
        filter={hoverFilter}
      />

      <Layer
        id={`${props.id}-border`}
        type="line"
        source={`mapbox-${props.sourceId}`}
        paint={{
          'line-color': '#9ca3af',
          'line-width': 0.5
        }}
      />

      <Layer
        id={`${props.id}-active`}
        type="line"
        source={`mapbox-${props.sourceId}`}
        paint={{
          'line-color': '#9ca3af',
          'line-width': 3
        }}
        filter={activeFilter}
      />
    </>
  );
}
