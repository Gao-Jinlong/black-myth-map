import React from 'react';
import ReactDOM from 'react-dom/client';
import BlackMythMap from './BlackMythMap';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <BlackMythMap />
    </React.StrictMode>,
  );
}
