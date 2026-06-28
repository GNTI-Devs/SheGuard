import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  openingHours?: string;
  operatorType?: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  tags: Record<string, string>;
}

interface HospitalMapProps {
  loading: boolean;
  hospitals: Hospital[];
  userCoords: { lat: number; lng: number } | null;
  selectedHospitalId: string | null;
  activeColors: {
    background: string;
    surface: string;
    border: string;
    primary: string;
    text: string;
    textMuted: string;
  };
}

const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Maternity Map</title>
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet" />
    <script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
    <style>
      body { margin: 0; padding: 0; background: #1E1412; }
      #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
      .mapboxgl-popup-content {
        background: #2E1E1B !important;
        color: #F4EFEB !important;
        font-family: system-ui, sans-serif;
        border-radius: 12px;
        border: 1px solid #4A2E2A;
        padding: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        max-width: 180px;
      }
      .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip { border-top-color: #2E1E1B !important; }
      .mapboxgl-popup-anchor-top .mapboxgl-popup-tip { border-bottom-color: #2E1E1B !important; }
      .custom-marker {
        width: 28px; height: 28px;
        background: #C85A46;
        border: 3px solid #F4EFEB;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(200,90,70,0.6);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px;
        transition: transform 0.2s;
      }
      .custom-marker:hover { transform: scale(1.2); }
      .user-marker {
        width: 16px; height: 16px;
        background: #3b82f6;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(59,130,246,0.8);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [3.4008, 6.4528],
        zoom: 11,
        attributionControl: false
      });

      var activeMarkers = [];
      var userMarker = null;

      function log(msg) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
      }

      map.on('load', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
      });

      document.addEventListener('message', handleMsg);
      window.addEventListener('message', handleMsg);

      function handleMsg(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === 'setUserLocation') {
            map.setCenter([data.lng, data.lat]);
            if (userMarker) userMarker.remove();
            var el = document.createElement('div');
            el.className = 'user-marker';
            userMarker = new maplibregl.Marker(el).setLngLat([data.lng, data.lat]).addTo(map);
          } else if (data.type === 'centerMap') {
            map.flyTo({ center: [data.lng, data.lat], zoom: 15, essential: true });
          } else if (data.type === 'render_markers') {
            activeMarkers.forEach(function(m) { m.remove(); });
            activeMarkers = [];
            data.list.forEach(function(el) {
              var markerEl = document.createElement('div');
              markerEl.className = 'custom-marker';
              markerEl.innerHTML = '🏥';
              var distTxt = el.distanceKm != null ? el.distanceKm + 'km away' : '';
              var popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(
                  '<strong style="font-size:13px;color:#C85A46;">' + el.name + '</strong>' +
                  (distTxt ? '<p style="margin:3px 0 0;font-size:11px;color:#AAA;">' + distTxt + '</p>' : '') +
                  (el.address && el.address !== 'Location details available on arrival'
                    ? '<p style="margin:3px 0 0;font-size:11px;color:#BCAEAA;">' + el.address + '</p>'
                    : '')
                );
              var marker = new maplibregl.Marker(markerEl).setLngLat([el.lng, el.lat]).setPopup(popup).addTo(map);
              activeMarkers.push(marker);
            });
            if (data.userCoords) {
              if (userMarker) userMarker.remove();
              var uEl = document.createElement('div');
              uEl.className = 'user-marker';
              userMarker = new maplibregl.Marker(uEl).setLngLat([data.userCoords.lng, data.userCoords.lat]).addTo(map);
              map.flyTo({ center: [data.userCoords.lng, data.userCoords.lat], zoom: 12 });
            }
          }
        } catch(e) { log('Parse error: ' + e.message); }
      }
    </script>
  </body>
  </html>
`;

export function HospitalMap({
  loading,
  hospitals,
  userCoords,
  selectedHospitalId,
  activeColors,
}: HospitalMapProps) {
  const webViewRef = useRef<WebView>(null);
  const mapReadyRef = useRef(false);
  const pendingMarkersRef = useRef<Hospital[] | null>(null);
  const pendingCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const postToWebView = (payload: object) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(payload));
    }
  };

  // Re-center map or update markers whenever dependencies change
  useEffect(() => {
    if (mapReadyRef.current && userCoords) {
      postToWebView({
        type: 'render_markers',
        list: hospitals,
        userCoords,
      });
    } else {
      pendingMarkersRef.current = hospitals;
      pendingCoordsRef.current = userCoords;
    }
  }, [hospitals, userCoords]);

  // Center on selected hospital
  useEffect(() => {
    if (selectedHospitalId) {
      const selected = hospitals.find((h) => h.id === selectedHospitalId);
      if (selected) {
        postToWebView({ type: 'centerMap', lat: selected.lat, lng: selected.lng });
      }
    }
  }, [selectedHospitalId, hospitals]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'map_ready') {
        mapReadyRef.current = true;
        if (pendingMarkersRef.current && pendingCoordsRef.current) {
          postToWebView({
            type: 'render_markers',
            list: pendingMarkersRef.current,
            userCoords: pendingCoordsRef.current,
          });
          pendingMarkersRef.current = null;
          pendingCoordsRef.current = null;
        } else if (userCoords) {
          postToWebView({
            type: 'setUserLocation',
            lat: userCoords.lat,
            lng: userCoords.lng,
          });
        }
      } else if (data.type === 'log') {
        console.log('[Map]', data.message);
      } else if (data.type === 'error') {
        console.error('[Map Error]', data.message);
      }
    } catch (_) {}
  };

  return (
    <View style={[styles.mapContainer, { borderColor: activeColors.border }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.mapWebView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        scrollEnabled={false}
        onMessage={handleMessage}
      />
      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: activeColors.background + 'CC' },
          ]}
        >
          <ActivityIndicator size="large" color={activeColors.primary} />
          <Text style={[styles.loadingText, { color: activeColors.text }]}>
            Finding nearest clinics...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginBottom: 10,
  },
  mapWebView: {
    flex: 1,
    backgroundColor: '#1E1412',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
