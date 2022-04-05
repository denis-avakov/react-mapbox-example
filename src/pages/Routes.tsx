import { Route } from 'wouter';
import MapFilter from './MapFilter';

export default function Routes() {
  return (
    <>
      <Route path="/" component={MapFilter} />
    </>
  );
}
