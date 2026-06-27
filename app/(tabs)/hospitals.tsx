import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  openingHours?: string;
  operatorType?: string; // 'hospital' | 'clinic'
  lat: number;
  lng: number;
  distanceKm?: number;
  tags: Record<string, string>;
}

/** Haversine formula: returns distance in km between two lat/lng points */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Build a rich human-readable address from OSM tags */
function buildAddress(tags: Record<string, string>): string {
  const parts: string[] = [];

  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street']);
  }

  if (tags['addr:suburb']) parts.push(tags['addr:suburb']);
  else if (tags['addr:neighbourhood']) parts.push(tags['addr:neighbourhood']);
  else if (tags['addr:quarter']) parts.push(tags['addr:quarter']);

  if (tags['addr:city']) parts.push(tags['addr:city']);
  else if (tags['addr:state']) parts.push(tags['addr:state']);

  if (parts.length > 0) return parts.join(', ');

  // Fallbacks from descriptive tags
  if (tags['description']) return tags['description'];
  if (tags['note']) return tags['note'];

  return 'Location details available on arrival';
}

/** Extract rich features from OSM tags */
function buildFeatures(tags: Record<string, string>): string[] {
  const features: string[] = [];

  if (tags.amenity === 'hospital') features.push('Hospital');
  else features.push('Clinic');

  if (
    tags['healthcare:speciality']?.toLowerCase().includes('obstetrics') ||
    tags['healthcare:speciality']?.toLowerCase().includes('gynaecology') ||
    tags['healthcare:speciality']?.toLowerCase().includes('maternity')
  ) {
    features.push('Maternity Unit');
  }
  if (
    tags['healthcare:speciality']?.toLowerCase().includes('paediatric') ||
    tags['healthcare:speciality']?.toLowerCase().includes('pediatric')
  ) {
    features.push('Paediatrics');
  }
  if (tags['emergency'] === 'yes') features.push('Emergency');
  if (tags['beds']) features.push(`${tags['beds']} beds`);
  if (tags['operator:type'] === 'public') features.push('Government');
  else if (tags['operator:type'] === 'private') features.push('Private');
  if (tags['wheelchair'] === 'yes') features.push('Wheelchair Access');

  // Default if nothing specific found
  if (features.length === 1) {
    if (tags.amenity === 'hospital') {
      features.push('Maternity Ward', 'General Care');
    } else {
      features.push('Prenatal Care', 'Outpatient');
    }
  }

  return features.slice(0, 3); // max 3 badges
}

/** Extract closest unique area names from fetched results for the pills */
function extractNearbyAreas(
  hospitals: Hospital[],
  userLat: number,
  userLng: number
): string[] {
  const areaCounts: Record<string, number> = {};

  hospitals.forEach((h) => {
    const area =
      h.tags['addr:suburb'] ||
      h.tags['addr:neighbourhood'] ||
      h.tags['addr:quarter'] ||
      h.tags['addr:city'] ||
      null;
    if (area && area.length > 2) {
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    }
  });

  // Sort by count descending → pick top 3
  return Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);
}

const CACHE_KEY_HOSPITALS = 'cached_hospitals_v2';
const CACHE_KEY_COORDS = 'cached_user_coords';
const CACHE_DISTANCE_THRESHOLD_KM = 3; // If user is within 3km of last fetch, use cache

export default function HospitalsScreen() {
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];
  const webViewRef = useRef<WebView>(null);
  const mapReadyRef = useRef(false);
  const pendingMarkersRef = useRef<Hospital[] | null>(null);
  const pendingCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyAreas, setNearbyAreas] = useState<string[]>([]);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const postToWebView = (payload: object) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(payload));
    }
  };

  const renderMarkersOnMap = useCallback(
    (list: Hospital[], coords: { lat: number; lng: number }) => {
      if (!mapReadyRef.current) {
        pendingMarkersRef.current = list;
        pendingCoordsRef.current = coords;
        return;
      }
      postToWebView({ type: 'render_markers', list, userCoords: coords });
    },
    []
  );

  const processAndSetHospitals = useCallback(
    (elements: any[], lat: number, lng: number) => {
      const list: Hospital[] = elements
        .filter((el) => el.tags && el.lat && el.lon)
        .map((el) => {
          const tags: Record<string, string> = el.tags || {};
          const name =
            tags.name ||
            tags['name:en'] ||
            tags['official_name'] ||
            'Medical Facility';
          const address = buildAddress(tags);
          const phone =
            tags.phone || tags['contact:phone'] || tags['telephone'] || '';
          const website = tags.website || tags['contact:website'] || '';
          const openingHours = tags['opening_hours'] || '';
          const distanceKm = haversineKm(lat, lng, el.lat, el.lon);

          return {
            id: el.id.toString(),
            name,
            address,
            phone,
            website,
            openingHours,
            operatorType: tags.amenity,
            lat: el.lat,
            lng: el.lon,
            distanceKm: Math.round(distanceKm * 10) / 10,
            tags,
          };
        })
        // Sort by closest first
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

      const areas = extractNearbyAreas(list, lat, lng);

      setHospitals(list);
      setNearbyAreas(areas);
      setActiveArea(null);
      if (list.length > 0) setSelectedHospitalId(list[0].id);
      setLoading(false);
      renderMarkersOnMap(list, { lat, lng });
    },
    [renderMarkersOnMap]
  );

  const fetchHospitals = useCallback(
    async (lat: number, lng: number, forceRefresh = false) => {
      setLoading(true);

      // --- Cache check ---
      if (!forceRefresh) {
        try {
          const cachedCoordsRaw = await AsyncStorage.getItem(CACHE_KEY_COORDS);
          const cachedDataRaw = await AsyncStorage.getItem(CACHE_KEY_HOSPITALS);
          if (cachedCoordsRaw && cachedDataRaw) {
            const cachedCoords = JSON.parse(cachedCoordsRaw);
            const dist = haversineKm(
              lat,
              lng,
              cachedCoords.lat,
              cachedCoords.lng
            );
            if (dist <= CACHE_DISTANCE_THRESHOLD_KM) {
              const cached = JSON.parse(cachedDataRaw);
              if (Array.isArray(cached) && cached.length > 0) {
                console.log(
                  `[Hospitals] Cache hit (${dist.toFixed(2)}km). Using ${
                    cached.length
                  } cached clinics.`
                );
                // Re-sort by new current position
                const resorted = cached
                  .map((h: Hospital) => ({
                    ...h,
                    distanceKm:
                      Math.round(haversineKm(lat, lng, h.lat, h.lng) * 10) / 10,
                  }))
                  .sort(
                    (a: Hospital, b: Hospital) =>
                      (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
                  );
                setHospitals(resorted);
                setNearbyAreas(extractNearbyAreas(resorted, lat, lng));
                setActiveArea(null);
                if (resorted.length > 0) setSelectedHospitalId(resorted[0].id);
                setLoading(false);
                renderMarkersOnMap(resorted, { lat, lng });
                return;
              }
            }
          }
        } catch (_) {}
      }

      // --- Live fetch ---
      try {
        console.log(
          `[Hospitals] Fetching live data for ${lat.toFixed(4)}, ${lng.toFixed(
            4
          )}...`
        );
        const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:15000,${lat},${lng});node["amenity"="clinic"](around:15000,${lat},${lng});node["healthcare"="hospital"](around:15000,${lat},${lng}););out body;`;

        const response = await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent':
                'SheGuardAI/1.0 (maternal health companion; contact: support@sheguard.org)',
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const elements = data.elements || [];
        console.log(`[Hospitals] Fetched ${elements.length} elements.`);

        processAndSetHospitals(elements, lat, lng);

        // Cache the new results
        await AsyncStorage.setItem(
          CACHE_KEY_COORDS,
          JSON.stringify({ lat, lng })
        );
        await AsyncStorage.setItem(
          CACHE_KEY_HOSPITALS,
          JSON.stringify(
            elements
              .filter((el: any) => el.tags && el.lat && el.lon)
              .map((el: any) => ({
                id: el.id.toString(),
                name: el.tags.name || el.tags['name:en'] || 'Medical Facility',
                address: buildAddress(el.tags),
                phone: el.tags.phone || el.tags['contact:phone'] || '',
                website: el.tags.website || '',
                openingHours: el.tags['opening_hours'] || '',
                operatorType: el.tags.amenity,
                lat: el.lat,
                lng: el.lon,
                distanceKm:
                  Math.round(haversineKm(lat, lng, el.lat, el.lon) * 10) / 10,
                tags: el.tags,
              }))
          )
        );
      } catch (err: any) {
        console.error('[Hospitals] Fetch failed:', err);
        setLoading(false);
        Alert.alert(
          'Could not load clinics',
          'Please check your internet connection and try again.'
        );
      }
    },
    [processAndSetHospitals, renderMarkersOnMap]
  );

  // On mount: get location then load
  useEffect(() => {
    async function initLocation() {
      try {
        const { status: existing } =
          await Location.getForegroundPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          // Try cached coords as fallback
          const cachedCoordsRaw = await AsyncStorage.getItem(CACHE_KEY_COORDS);
          if (cachedCoordsRaw) {
            const c = JSON.parse(cachedCoordsRaw);
            setUserCoords(c);
            await fetchHospitals(c.lat, c.lng);
          } else {
            setLoading(false);
            Alert.alert(
              'Location Required',
              'Please allow location access to find nearby maternity clinics.'
            );
          }
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        postToWebView({
          type: 'setUserLocation',
          lat: coords.lat,
          lng: coords.lng,
        });
        await fetchHospitals(coords.lat, coords.lng);
      } catch (err) {
        console.warn('[Hospitals] Location init failed:', err);
        setLoading(false);
      }
    }
    initLocation();
  }, []);

  const handleSelectHospital = (h: Hospital) => {
    setSelectedHospitalId(h.id);
    postToWebView({ type: 'centerMap', lat: h.lat, lng: h.lng });
  };

  const handleCallHospital = (phone: string) => {
    if (!phone) {
      Alert.alert(
        'No Number',
        'No phone number is listed. Calling emergency services.'
      );
      Linking.openURL('tel:112');
      return;
    }
    const clean = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() =>
      Alert.alert('Error', 'Unable to initiate call.')
    );
  };

  const handleAreaPill = (area: string) => {
    setActiveArea(area === activeArea ? null : area);
  };

  const handleRefresh = () => {
    if (userCoords) fetchHospitals(userCoords.lat, userCoords.lng, true);
  };

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
        }
        if (userCoords) {
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

  // Filter displayed list by active area pill & search query
  const displayedHospitals = hospitals.filter((h) => {
    // 1. Area filter
    if (activeArea) {
      const matchArea =
        h.tags['addr:suburb'] === activeArea ||
        h.tags['addr:neighbourhood'] === activeArea ||
        h.tags['addr:quarter'] === activeArea ||
        h.tags['addr:city'] === activeArea;
      if (!matchArea) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = h.name?.toLowerCase().includes(q);
      const matchAddr = h.address?.toLowerCase().includes(q);
      const matchCity = h.tags['addr:city']?.toLowerCase().includes(q);
      const matchSuburb = h.tags['addr:suburb']?.toLowerCase().includes(q);
      return matchName || matchAddr || matchCity || matchSuburb;
    }

    return true;
  });

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="medical" size={24} color={activeColors.primary} />
          <Text style={[styles.headerTitle, { color: activeColors.text }]}>
            Maternity Locator
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          style={[styles.refreshBtn, { borderColor: activeColors.border }]}
          disabled={loading}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={loading ? activeColors.textMuted : activeColors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: activeColors.surface,
            borderColor: activeColors.border,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={activeColors.textMuted} />
        <TextInput
          placeholder="Search clinics or hospitals..."
          placeholderTextColor={activeColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: activeColors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={activeColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
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

      {/* Area Filter Pills — dynamically built from real fetched data */}
      {nearbyAreas.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {/* "All" pill */}
          <TouchableOpacity
            onPress={() => setActiveArea(null)}
            style={[
              styles.pill,
              {
                backgroundColor:
                  activeArea === null
                    ? activeColors.primary
                    : activeColors.surface,
                borderColor: activeColors.border,
              },
            ]}
          >
            <Ionicons
              name="locate"
              size={14}
              color={activeArea === null ? '#fff' : activeColors.primary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: activeArea === null ? '#fff' : activeColors.textMuted,
                },
              ]}
            >
              All nearby
            </Text>
          </TouchableOpacity>

          {nearbyAreas.map((area) => (
            <TouchableOpacity
              key={area}
              onPress={() => handleAreaPill(area)}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    activeArea === area
                      ? activeColors.primary
                      : activeColors.surface,
                  borderColor: activeColors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color:
                      activeArea === area ? '#fff' : activeColors.textMuted,
                  },
                ]}
              >
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Hospital Cards */}
      <FlatList
        data={displayedHospitals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={activeColors.textMuted}
              />
              <Text
                style={[styles.emptyText, { color: activeColors.textMuted }]}
              >
                No maternity clinics found nearby. Try refreshing.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isSelected = selectedHospitalId === item.id;
          const features = buildFeatures(item.tags);
          return (
            <TouchableOpacity
              onPress={() => handleSelectHospital(item)}
              style={[
                styles.hospitalCard,
                {
                  backgroundColor: activeColors.surface,
                  borderColor: isSelected
                    ? activeColors.primary
                    : activeColors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text
                    style={[styles.hospitalName, { color: activeColors.text }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  {item.distanceKm != null && (
                    <View
                      style={[
                        styles.distanceBadge,
                        { backgroundColor: activeColors.primaryMuted },
                      ]}
                    >
                      <Text
                        style={[
                          styles.distanceText,
                          { color: activeColors.primary },
                        ]}
                      >
                        {item.distanceKm} km
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleCallHospital(item.phone)}
                  style={[
                    styles.callButton,
                    { backgroundColor: activeColors.primary },
                  ]}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={activeColors.textMuted}
                />
                <Text
                  style={[
                    styles.hospitalAddress,
                    { color: activeColors.textMuted },
                  ]}
                  numberOfLines={2}
                >
                  {item.address}
                </Text>
              </View>

              {item.openingHours ? (
                <View style={styles.hoursRow}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={activeColors.textMuted}
                  />
                  <Text
                    style={[
                      styles.hoursText,
                      { color: activeColors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {item.openingHours}
                  </Text>
                </View>
              ) : null}

              <View style={styles.badgeContainer}>
                {features.map((feat, i) => (
                  <View
                    key={i}
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          i === 0
                            ? activeColors.primaryMuted
                            : activeColors.surface2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            i === 0
                              ? activeColors.primary
                              : activeColors.textMuted,
                        },
                      ]}
                    >
                      {feat}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
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
  pillsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  hospitalCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: {
    flex: 1,
    gap: 4,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  distanceBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  hospitalAddress: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hoursText: {
    fontSize: 12,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
