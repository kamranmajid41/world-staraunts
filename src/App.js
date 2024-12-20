import * as React from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { MantineProvider, Title, Button, Group, Modal, FileInput, Loader, SegmentedControl } from '@mantine/core';
import { useState, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';  // Mapbox styles
import heic2any from 'heic2any';  // Import the HEIC to Any conversion library
import marker_bg from './media/marker_red.png'; 
import * as turf from '@turf/turf';


// Replace with your actual Mapbox token
const MAPBOX_TOKEN = "pk.eyJ1Ijoia21hamlkMiIsImEiOiJjbTN4dDhsbWcwdHpuMmxwc3ExZ3RmZHhtIn0.OUQ0soIdbzoteoOpw5r9_g";

function App() {
  const [markers, setMarkers] = useState([]);  // Store markers
  const [modalOpened, setModalOpened] = useState(false);  // State for modal visibility
  const [currentMarker, setCurrentMarker] = useState(null);  // The marker currently being edited
  const [image, setImage] = useState(null);  // The uploaded image URL
  const [modalImage, setModalImage] = useState(null);  // Image to display in the modal when marker is clicked
  const [loading, setLoading] = useState(false);  // Track the loading state for image processing
  const [viewMode, setViewMode] = useState('3d');  // Track current view mode (2D or 3D)
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);  // Track the selected marker for deletion
  const [countriesGeojson, setCountriesGeojson] = useState(null);  // GeoJSON data for countries
  const [countriesWithMarkers, setCountriesWithMarkers] = useState(new Set());  // To track countries that have markers

  // Handle map click to add a marker and open the modal
  const handleMapClick = (e) => {
    const lngLat = e.lngLat;
    setCurrentMarker({ lat: lngLat.lat, lng: lngLat.lng });
    setModalOpened(true);  // Open the modal for image upload
  };

  useEffect(() => {
    fetch('/world-staraunts/countries.geojson')  // Fetch the file directly from the public folder
      .then(response => response.json())
      .then(data => {
        setCountriesGeojson(data);
      })
      .catch((error) => {
        console.error('Error loading GeoJSON:', error);
      });
  }, []);

  // Handle file upload
  const handleFileUpload = (file) => {
    if (file) {
      setLoading(true);

      if (file.type === 'image/heic') {
        heic2any({ blob: file, toType: 'image/jpeg' })
          .then((convertedImage) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImage(reader.result);
              const newMarker = { lat: currentMarker.lat, lng: currentMarker.lng, image: reader.result };
              const newMarkers = [...markers, newMarker];
              setMarkers(newMarkers);
              updateCountriesWithMarkers(newMarkers);
              setModalOpened(false);
              setLoading(false);
            };
            reader.readAsDataURL(convertedImage);
          })
          .catch((err) => {
            console.error('Error converting HEIC to JPEG:', err);
            setLoading(false);
          });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result);
          const newMarker = { lat: currentMarker.lat, lng: currentMarker.lng, image: reader.result };
          const newMarkers = [...markers, newMarker];
          setMarkers(newMarkers);
          updateCountriesWithMarkers(newMarkers);
          setModalOpened(false);
          setLoading(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Update the list of countries that have markers
  const updateCountriesWithMarkers = (newMarkers) => {
    const countriesSet = new Set();

    if (countriesGeojson && countriesGeojson.features) {
      newMarkers.forEach((marker) => {
        countriesGeojson.features.forEach((country) => {
          const point = turf.point([marker.lng, marker.lat]);
          if (turf.booleanPointInPolygon(point, country)) {
            countriesSet.add(country.properties.ADMIN);
          }
        });
      });
    } else {
      console.error('GeoJSON features are missing or not loaded correctly.');
    }

    setCountriesWithMarkers(countriesSet);
  };

  // Handle marker click to open the modal with the image enlarged and also update countries
  const handleMarkerClick = (image, index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setModalImage(image);
    setSelectedMarkerIndex(index);  // Set the selected marker index for deletion
    setModalOpened(true);

    // Update the countries with markers when clicking on a marker
    const newMarkers = [...markers];
    updateCountriesWithMarkers(newMarkers);
  };

  // Handle Segmented Control change to toggle 2D/3D view
  const handleViewChange = (value) => {
    setViewMode(value);
  };

  // Download markers as JSON
  const handleDownload = () => {
    const dataStr = JSON.stringify(markers);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'staraunts.json';
    link.click();
  };

  // Upload markers JSON file
  const handleUpload = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const json = JSON.parse(reader.result);
          if (Array.isArray(json)) {
            setMarkers(json);
            updateCountriesWithMarkers(json);
          } else {
            alert('Invalid JSON format');
          }
        } catch (error) {
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Delete selected marker
  const handleDeleteMarker = () => {
    if (selectedMarkerIndex !== null) {
      const updatedMarkers = markers.filter((_, index) => index !== selectedMarkerIndex);
      setMarkers(updatedMarkers);
      updateCountriesWithMarkers(updatedMarkers);
      setModalOpened(false);  // Close the modal after deletion
      setSelectedMarkerIndex(null);  // Reset the selected marker index
    }
  };

  function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'black' }}>
      
      {/* Sidebar on the right for instructions and buttons */}
      <div style={{
        width: '300px',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
      }}>
        <h5 style={{ color: '#ffcc00' }}>by Kamran M</h5>
        <p><strong>1. Add a Marker:</strong> Click anywhere on the map to add a marker at that location.</p>
        <p><strong>2. Upload an Image:</strong> After clicking a location, upload an image related to the marker.</p>
        <p><strong>3. Download Markers:</strong> Download your markers and their images as a JSON file using the "Download" button below.</p>
        <p><strong>4. Upload Markers:</strong> You can upload a previously saved markers file by clicking "Upload".</p>
        <p><strong>5. Toggle View:</strong> Use the Segmented Control at the top right to switch between 2D and 3D map views.</p>
        
        {/* Upload and Download Buttons */}
        <div style={{ marginTop: '20px' }}>
          <Group direction="column" spacing="xs">
            <FileInput 
              onChange={handleUpload} 
              accept="application/json"
              size="sm"
              placeholder="Upload Staraunts"
            />
            <Button variant="default" size="sm" onClick={handleDownload}>Download</Button>
          </Group>
        </div>
      </div>

      {/* Floating Title */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
      }}>
        <Title 
          align="left" 
          style={{ 
            fontFamily: 'Courier New, monospace', 
            color: 'white', 
            margin: 0, 
            fontSize: '24px', 
          }}
        >
          world-staurants
        </Title>
      </div>
      
      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: -82,
            latitude: 23,
            zoom: 2,
          }}
          projection={viewMode === '2d' ? 'mercator' : 'globe'}
          style={{ width: '100%', height: '100%' }}
          mapStyle={'mapbox://styles/mapbox/dark-v11'}
          onClick={handleMapClick}
        >

          {/* Country Layer */}
          <Source type="geojson" data={countriesGeojson}>
            <Layer
              id="countries"
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['in', ['get', 'ADMIN'], ['literal', Array.from(countriesWithMarkers)]], // Correctly pass the array as a literal
                  '#FF5733',  // Color for countries with markers (highlighted)
                  '#d3d3d3',   // Default color for countries without markers
                ],
                'fill-opacity': [
                  'case',
                  ['in', ['get', 'ADMIN'], ['literal', Array.from(countriesWithMarkers)]], // Correctly pass the array as a literal
                  0.6,  // Color for countries with markers (highlighted)
                  0,   // Default color for countries without markers
                ],
              }}
            />
          </Source>


          {/* Markers */}
          {markers.map((marker, index) => (
            <Marker key={index} longitude={marker.lng} latitude={marker.lat} anchor="bottom">
              <div onClick={(e) => handleMarkerClick(marker.image, index, e)}>
                <img src={marker.image || '/default-marker.png'} alt="marker" width={40} height={40} />
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* Segmented Control for 2D/3D toggle */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
      }}>
        <SegmentedControl
          value={viewMode}
          onChange={handleViewChange}
          data={[
            { label: '2D', value: '2d' },
            { label: '3D', value: '3d' },
          ]}
        />
      </div>

      {/* Modal for image upload */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Upload Image"
        centered
      >
        <FileInput
          label="Choose Image"
          accept="image/png, image/jpeg, image/heic"
          onChange={handleFileUpload}
        />
        {loading && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Loader size="lg" />
            <div>Processing HEIC file...</div>
          </div>
        )}
      </Modal>

      {/* Modal for enlarged marker image with delete option */}
      <Modal
        opened={!!modalImage}
        onClose={() => setModalImage(null)}
        title="Eater pic"
        centered
        size="xl"
      >
        <Group position="center" style={{ marginTop: '20px' }}>
          {modalImage && <img src={modalImage} alt="Enlarged Marker" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }} />}
          <Button color="red" onClick={handleDeleteMarker}>Delete Staraunt</Button>
        </Group>
      </Modal>
    </div>
  );
}

export default App;
