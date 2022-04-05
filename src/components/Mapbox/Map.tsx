import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Map as MapGL, Source, Marker, Popup } from 'react-map-gl';
import { bbox, booleanPointInPolygon, intersect, area, centerOfMass } from '@turf/turf';
import { filter, debounce, compact } from 'lodash';
import type { MapRef, MapLayerMouseEvent, MapboxGeoJSONFeature } from 'react-map-gl';
import type { Feature, Polygon, Point, Geometry } from '@turf/turf';

import Spinner from '../Spinner';
import DynamicLayer from './Layers/DynamicLayer';
import ClusterLayer from './Layers/ClusterLayer';
import LanduseLayer from './Layers/LanduseLayer';
import BuildingsLayer from './Layers/BuildingsLayer';
import Pin from './Layers/Pin';

type MapProps = {
  mapboxAccessToken: string;
  apartments: Feature<Point>[];
  districts: Feature<Polygon>[];
  subdistricts: Feature<Polygon>[];
};

type PopupProps = {
  longitude?: number;
  latitude?: number;
  properties?: any;
  shown: boolean;
};

const Appartment = (props: any) => (
  <a href="#" className="flex space-x-2 rounded-sm hover:ring-2 hover:ring-offset-2">
    <img src="/1232816163-4.jpg" className="h-14 w-20 rounded-sm object-scale-down" />

    <div className="w-60">
      <div className="whitespace-nowrap">{props.address}</div>
      <div className="text-lg font-medium text-teal-700">{props.price}</div>
    </div>
  </a>
);

export default function Map(props: MapProps) {
  const mapRef = useRef<MapRef>(null);

  const [isMapboxLoading, setMapboxLoading] = useState<boolean>(true);
  const [currentHover, setCurrentHover] = useState<string>('');
  const [currentSource, setCurrentSource] = useState<string>('mapbox-districts');

  const [popup, setPopup] = useState<PopupProps>({ shown: false });
  const [buildingFeatures, setBuildingFeatures] = useState<Feature<Polygon>[]>([]);
  const [clusterPoints, setClusterPoints] = useState<Feature<Point>[]>([]);

  const [districtFeatures, setDistrictFeatures] = useState<Feature<Polygon>[]>([]);
  const [subdistrictFeatures, setSubdistrictFeatures] = useState<Feature<Polygon>[]>([]);
  const [pinFeatures, setPinFeatures] = useState<Feature<Polygon>[]>([]);

  useEffect(() => {
    setDistrictFeatures(props.districts);
    setPinFeatures(props.districts);
  }, []);

  const getBuildingsWithinClusterView = () => {
    const sourceFeatureBuildings = mapRef.current?.querySourceFeatures('composite', {
      sourceLayer: 'building'
    });

    const sourceFeaturePoints = mapRef.current?.querySourceFeatures('mapbox-apartments', {
      sourceLayer: 'clusters'
    });

    const features = [];

    if (sourceFeatureBuildings?.length && sourceFeaturePoints?.length) {
      for (const building of sourceFeatureBuildings) {
        for (const point of sourceFeaturePoints) {
          if (point.geometry.type === 'Point' && building.geometry.type === 'Polygon') {
            if (booleanPointInPolygon(point.geometry, building.geometry)) {
              features.push(building as Feature<Polygon>);
            }
          }
        }
      }
    }

    return features;
  };

  const getIntersectFeatures = (
    arrayFeatures: Feature<Polygon>[],
    iterateeFeature: Feature<Polygon>
  ): Feature<Polygon>[] | [] => {
    const intersectFeatures = arrayFeatures.map((currentFeature) => {
      const intersection = intersect(currentFeature, iterateeFeature);

      if (intersection) {
        const areaIntersection = area(intersection.geometry);
        const areaDistrict = area(iterateeFeature.geometry);

        if ((areaIntersection / areaDistrict) * 100 > 1) {
          return currentFeature;
        }
      }
    });

    return compact(intersectFeatures);
  };

  const getPointsWithinPolygon = (feature: Feature<Polygon>) => {
    const points = props.apartments.map((point) => {
      if (booleanPointInPolygon(point.geometry, feature.geometry)) {
        return point;
      }
    });

    return compact(points);
  };

  const getSourceFeature = (event: MapLayerMouseEvent) => {
    return filter(event.features, ['source', currentSource])[0];
  };

  const getFeatureFromGeoJSON = (currentFeature: MapboxGeoJSONFeature) => {
    let geoJSON: Feature<Polygon>[] | [] = [];

    if (currentFeature.source === 'mapbox-districts') {
      geoJSON = props.districts;
    }

    if (currentFeature.source === 'mapbox-subdistricts') {
      geoJSON = props.subdistricts;
    }

    return filter(geoJSON, ['properties.id', currentFeature.properties?.id])[0];
  };

  const fitBounds = (geometry: Geometry) => {
    const [minLng, minLat, maxLng, maxLat] = bbox(geometry);

    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      {
        padding: 100
      }
    );
  };

  const pins = useMemo(
    () =>
      pinFeatures.map((district, index) => {
        const centerPoint = centerOfMass(district);
        const amount = getPointsWithinPolygon(district);

        return (
          <Marker
            key={`marker-${index}`}
            longitude={centerPoint.geometry.coordinates[0]}
            latitude={centerPoint.geometry.coordinates[1]}
            anchor="bottom"
          >
            <Pin amount={amount.length} name={district.properties?.NAME_ENG} />
          </Marker>
        );
      }),
    [pinFeatures]
  );

  const onRender = useCallback(
    debounce(() => {
      const buildings = getBuildingsWithinClusterView();
      setBuildingFeatures(buildings);
    }, 100),
    []
  );

  const onHover = useCallback(
    (event: MapLayerMouseEvent) => {
      const currentFeature = filter(event.features, ['source', currentSource]);
      const currentPoint = filter(event.features, ['source', 'mapbox-apartments']);

      setCurrentHover(currentFeature[0]?.properties?.id || '');

      if (currentPoint[0]?.geometry.type === 'Point') {
        setPopup({
          longitude: currentPoint[0]?.geometry.coordinates[0],
          latitude: currentPoint[0]?.geometry.coordinates[1],
          properties: currentPoint[0]?.properties,
          shown: true
        });
      }
    },
    [currentHover]
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const currentFeature = getSourceFeature(event);
      const featureGeoJSON = getFeatureFromGeoJSON(currentFeature);
      const pointsWithinGeoJSON = getPointsWithinPolygon(featureGeoJSON);

      if (currentFeature.source === 'mapbox-districts') {
        const subdistrictFeatures = getIntersectFeatures(props.subdistricts, featureGeoJSON);

        setCurrentSource('mapbox-subdistricts');
        setDistrictFeatures([featureGeoJSON]);
        setSubdistrictFeatures(subdistrictFeatures);
        setPinFeatures(subdistrictFeatures);
      }

      if (currentFeature.source === 'mapbox-subdistricts') {
        setDistrictFeatures([]);
        setSubdistrictFeatures([featureGeoJSON]);
        setClusterPoints(pointsWithinGeoJSON);
        setPinFeatures([]);
      }

      setCurrentHover('');
      fitBounds(featureGeoJSON.geometry);
    },
    [currentSource]
  );

  return (
    <>
      {isMapboxLoading && (
        <div className="absolute z-10 h-screen w-screen bg-gray-400">
          <div className="flex h-screen flex-col justify-center">
            <Spinner />
          </div>
        </div>
      )}

      <MapGL
        ref={mapRef}
        mapboxAccessToken={props.mapboxAccessToken}
        initialViewState={{
          longitude: 34.9,
          latitude: 31.8,
          zoom: 7.5
        }}
        minZoom={6}
        maxZoom={18}
        doubleClickZoom={false}
        mapStyle="mapbox://styles/den3er/ckyimlrbwbfq516n2yz1s9aza"
        interactiveLayerIds={['district-body', 'subdistrict-body', 'unclustered-point']}
        onMouseMove={onHover}
        onClick={onClick}
        onIdle={() => setMapboxLoading(false)}
        onRender={onRender}
      >
        <BuildingsLayer features={buildingFeatures} />
        {/* <LanduseLayer /> */}

        {popup.shown && (
          <Popup
            longitude={popup?.longitude || 0}
            latitude={popup?.latitude || 0}
            anchor="bottom"
            closeButton={false}
            closeOnMove={true}
            onClose={() => setPopup({ shown: false })}
          >
            {popup.properties?.deals && (
              <div className="space-y-2">
                {JSON.parse(popup.properties?.deals).map((value: any, key: number) => (
                  <Appartment key={key} {...value} />
                ))}
              </div>
            )}
          </Popup>
        )}

        <Source
          id="mapbox-districts"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: districtFeatures
          }}
        >
          <DynamicLayer
            id="district"
            sourceId="districts"
            currentHover={currentHover}
            features={districtFeatures}
          />
        </Source>

        <Source
          id="mapbox-subdistricts"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: subdistrictFeatures
          }}
        >
          <DynamicLayer
            id="subdistrict"
            sourceId="subdistricts"
            currentHover={currentHover}
            features={subdistrictFeatures}
          />
        </Source>

        <Source
          id="mapbox-apartments"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: clusterPoints
          }}
          cluster={true}
          clusterMaxZoom={12}
          clusterRadius={50}
        >
          <ClusterLayer />
        </Source>

        {pins}
      </MapGL>
    </>
  );
}
