import './styles.css';

import { StrictMode } from 'react';
import { render } from 'react-dom';
import { SWRConfig } from 'swr';
import Routes from './pages/Routes';
import fetcher from './utils/fetcher';

render(
  <StrictMode>
    <SWRConfig value={{ revalidateOnFocus: false, fetcher }}>
      <Routes />
    </SWRConfig>
  </StrictMode>,
  document.getElementById('root')
);
