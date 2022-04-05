import useSWR from 'swr';
import { nanoid } from 'nanoid';
import type { Feature } from '@turf/turf';
import Spinner from '../Spinner';
import Map from './Map';

export default function Mapbox() {
  const { data: apps1, error: appsError1 } = useSWR('/api/apps-1.json');
  const { data: apps2, error: appsError2 } = useSWR('/api/apps-2.json');
  const { data: districts, error: districtsError } = useSWR('/api/districts.json');
  const { data: subdistricts, error: subdistrictsError } = useSWR('/api/subdistricts.json');

  if (appsError1 || appsError2 || districtsError || subdistrictsError) {
    throw new Error('Error from API...');
  }

  if (!apps1 || !apps2 || !districts || !subdistricts) {
    return (
      <div className="flex h-screen flex-col justify-center">
        <Spinner />
      </div>
    );
  }

  const generateFeatureId = (props: Feature) => ({
    ...props,
    properties: {
      ...props.properties,
      id: nanoid()
    }
  });

  return (
    <Map
      mapboxAccessToken={import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN as string}
      apartments={[...apps1.data, ...apps2.data]}
      districts={districts.data.map(generateFeatureId)}
      subdistricts={subdistricts.data.map(generateFeatureId)}
    />
  );
}
