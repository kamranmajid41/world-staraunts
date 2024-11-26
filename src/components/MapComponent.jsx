import * as React from 'react';
import { Map } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';  // Required to apply Mapbox styles

function App() {
  return (
    <Map
      mapboxAccessToken="your_mapbox_access_token_here"  // Replace with your Mapbox token
      initialViewState={{
        longitude: 0,     // Set to 0,0 for global view
        latitude: 0,      // Set to 0,0 for global view
        zoom: 1,          // Start with zoomed-out view to see the whole globe
      }}
      style={{
        width: '100%',    // Full width
        height: '100vh',  // Full height (viewport height)
      }}
      mapStyle="mapbox://styles/mapbox/dark-v10"  // Dark theme style
    />
  );
}

export default App;
