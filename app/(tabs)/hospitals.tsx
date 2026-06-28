import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { HospitalMap, Hospital } from '@/components/HospitalMap';
import { HospitalCard } from '@/components/HospitalCard';

const CACHE_KEY_HOSPITALS = 'cached_hospitals_v2';
const CACHE_KEY_COORDS = 'cached_user_coords';
const CACHE_DISTANCE_THRESHOLD_KM = 3; // If user is within 3km of last fetch, use cache

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

  const houseNumber = tags['addr:housenumber'] || tags['housenumber'];
  const street = tags['addr:street'] || tags['street'];

  if (houseNumber && street) {
    parts.push(`${houseNumber} ${street}`);
  } else if (street) {
    parts.push(street);
  }

  const place = tags['addr:place'] || tags['place'];
  if (place && !street) {
    parts.push(place);
  }

  const suburb =
    tags['addr:suburb'] ||
    tags['suburb'] ||
    tags['addr:neighbourhood'] ||
    tags['neighbourhood'] ||
    tags['addr:quarter'] ||
    tags['quarter'];
  if (suburb) {
    parts.push(suburb);
  }

  const city =
    tags['addr:city'] ||
    tags['city'] ||
    tags['addr:province'] ||
    tags['province'] ||
    tags['addr:state'] ||
    tags['state'];
  if (city) {
    parts.push(city);
  }

  if (parts.length > 0) return parts.join(', ');

  // Fallbacks from descriptive tags
  if (tags['description']) return tags['description'];
  if (tags['note']) return tags['note'];

  return '';
}

export default function HospitalsScreen() {
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Name filter: instantly filters the currently-loaded list
  const [nameFilter, setNameFilter] = useState('');
  // Location search: geocodes the query and fetches new hospitals
  const [locationQuery, setLocationQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Saved hospitals
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [searchedArea, setSearchedArea] = useState('your location');

  const SAVED_KEY = 'saved_hospital_ids';

  // Load saved hospitals from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY)
      .then((raw) => {
        if (raw) setSavedIds(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  // Filter displayed list by name filter and saved filter
  const displayedHospitals = hospitals.filter((h) => {
    // 1. Saved-only filter
    if (showSavedOnly && !savedIds.includes(h.id)) return false;

    // 2. Name/address text filter (instant, client-side)
    if (nameFilter.trim()) {
      const q = nameFilter.toLowerCase().trim();
      const matchName = h.name?.toLowerCase().includes(q);
      const matchAddr = h.address?.toLowerCase().includes(q);
      const matchCity = h.tags['addr:city']?.toLowerCase().includes(q);
      const matchSuburb = h.tags['addr:suburb']?.toLowerCase().includes(q);
      return matchName || matchAddr || matchCity || matchSuburb;
    }

    return true;
  });

  const processAndSetHospitals = useCallback(
    (elements: any[], lat: number, lng: number) => {
      const list: Hospital[] = elements
        .filter((el) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
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
          const elLat = el.lat || el.center.lat;
          const elLon = el.lon || el.center.lon;
          const distanceKm = haversineKm(lat, lng, elLat, elLon);

          return {
            id: el.id.toString(),
            name,
            address,
            phone,
            website,
            openingHours,
            operatorType: tags.amenity,
            lat: elLat,
            lng: elLon,
            distanceKm: Math.round(distanceKm * 10) / 10,
            tags,
          };
        })
        // Sort by closest first
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

      setHospitals(list);
      if (list.length > 0) setSelectedHospitalId(list[0].id);
      setLoading(false);
    },
    []
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
                if (resorted.length > 0) setSelectedHospitalId(resorted[0].id);
                setLoading(false);
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
        // Query nodes, ways, and relations matching hospital or clinic to get complete building outline details
        const query = `[out:json][timeout:25];(node["amenity"~"hospital|clinic"](around:15000,${lat},${lng});way["amenity"~"hospital|clinic"](around:15000,${lat},${lng});relation["amenity"~"hospital|clinic"](around:15000,${lat},${lng});node["healthcare"~"hospital|clinic"](around:15000,${lat},${lng});way["healthcare"~"hospital|clinic"](around:15000,${lat},${lng});relation["healthcare"~"hospital|clinic"](around:15000,${lat},${lng}););out center;`;

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
              .filter((el: any) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
              .map((el: any) => {
                const elLat = el.lat || el.center.lat;
                const elLon = el.lon || el.center.lon;
                return {
                  id: el.id.toString(),
                  name: el.tags.name || el.tags['name:en'] || 'Medical Facility',
                  address: buildAddress(el.tags),
                  phone: el.tags.phone || el.tags['contact:phone'] || '',
                  website: el.tags.website || '',
                  openingHours: el.tags['opening_hours'] || '',
                  operatorType: el.tags.amenity,
                  lat: elLat,
                  lng: elLon,
                  distanceKm:
                    Math.round(haversineKm(lat, lng, elLat, elLon) * 10) / 10,
                  tags: el.tags,
                };
              })
          )
        );
      } catch (err: any) {
        console.error('[Hospitals] Fetch failed:', err);
        setLoading(false);
        Alert.alert(
          'Network Error',
          'Could not retrieve nearby maternal clinics. Please try again.'
        );
      }
    },
    [processAndSetHospitals]
  );

  // Load user location on mount
  useEffect(() => {
    async function initLocation() {
      try {
        const { status } = await Location.getLastKnownPositionAsync().then(
          () => Location.getForegroundPermissionsAsync()
        );

        let finalStatus = status;
        if (status !== 'granted') {
          const { status: askStatus } =
            await Location.requestForegroundPermissionsAsync();
          finalStatus = askStatus;
        }

        if (finalStatus !== 'granted') {
          // Try cached coords as fallback
          const cachedCoordsRaw = await AsyncStorage.getItem(CACHE_KEY_COORDS);
          if (cachedCoordsRaw) {
            const c = JSON.parse(cachedCoordsRaw);
            setUserCoords(c);
            setSearchedArea('your location');
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
        setSearchedArea('your location');
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

  const handleToggleSave = async (id: string) => {
    try {
      const updated = savedIds.includes(id)
        ? savedIds.filter((x) => x !== id)
        : [...savedIds, id];
      setSavedIds(updated);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const handleRefresh = () => {
    if (userCoords) fetchHospitals(userCoords.lat, userCoords.lng, true);
  };

  /** Geocode a place name via Nominatim, then fetch hospitals for that location */
  const handleLocationSearch = async () => {
    const query = locationQuery.trim();
    if (!query) return;
    setIsGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'SheGuardAI/1.0 (maternal health companion; contact: support@sheguard.org)',
        },
      });
      const data = await res.json();
      if (!data || data.length === 0) {
        Alert.alert(
          'Place Not Found',
          `"${query}" could not be found. Try a different search.`
        );
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setUserCoords({ lat, lng });
      setSearchedArea(query);
      await fetchHospitals(lat, lng, true);
    } catch (err) {
      Alert.alert('Search Error', 'Could not search that location. Check your connection.');
    } finally {
      setIsGeocoding(false);
    }
  };

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

      {/* Hospital Cards */}
      <FlatList
        data={displayedHospitals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <HospitalHeader
            locationQuery={locationQuery}
            setLocationQuery={setLocationQuery}
            onLocationSearch={handleLocationSearch}
            isGeocoding={isGeocoding}
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            loading={loading}
            hospitals={hospitals}
            userCoords={userCoords}
            selectedHospitalId={selectedHospitalId}
            showSavedOnly={showSavedOnly}
            setShowSavedOnly={setShowSavedOnly}
            savedCount={savedIds.length}
            activeColors={activeColors}
          />
        }
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
        renderItem={({ item }) => (
          <HospitalCard
            item={item}
            isSelected={selectedHospitalId === item.id}
            isSaved={savedIds.includes(item.id)}
            searchedArea={searchedArea}
            onSelect={handleSelectHospital}
            onToggleSave={handleToggleSave}
            onCall={handleCallHospital}
            activeColors={activeColors}
          />
        )}
      />
    </SafeAreaView>
  );
}

interface HospitalHeaderProps {
  locationQuery: string;
  setLocationQuery: (q: string) => void;
  onLocationSearch: () => void;
  isGeocoding: boolean;
  nameFilter: string;
  setNameFilter: (f: string) => void;
  loading: boolean;
  hospitals: Hospital[];
  userCoords: { lat: number; lng: number } | null;
  selectedHospitalId: string | null;
  showSavedOnly: boolean;
  setShowSavedOnly: (s: boolean) => void;
  savedCount: number;
  activeColors: any;
}

function HospitalHeader({
  locationQuery,
  setLocationQuery,
  onLocationSearch,
  isGeocoding,
  nameFilter,
  setNameFilter,
  loading,
  hospitals,
  userCoords,
  selectedHospitalId,
  showSavedOnly,
  setShowSavedOnly,
  savedCount,
  activeColors,
}: HospitalHeaderProps) {
  return (
    <View>
      {/* Location Search Bar — geocodes the typed place, fetches new hospitals */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: activeColors.surface,
            borderColor: activeColors.border,
            marginTop: 10,
          },
        ]}
      >
        <Ionicons name="location" size={18} color={activeColors.primary} />
        <TextInput
          placeholder="Search by area e.g. Ikorodu, Surulere..."
          placeholderTextColor={activeColors.textMuted}
          value={locationQuery}
          onChangeText={setLocationQuery}
          onSubmitEditing={onLocationSearch}
          returnKeyType="search"
          style={[styles.searchInput, { color: activeColors.text }]}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isGeocoding ? (
          <ActivityIndicator size="small" color={activeColors.primary} />
        ) : (
          <TouchableOpacity onPress={onLocationSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="search" size={18} color={activeColors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Name Filter Bar — instantly filters the currently-loaded list */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: activeColors.surface,
            borderColor: activeColors.border,
            marginTop: 6,
          },
        ]}
      >
        <Ionicons name="filter" size={18} color={activeColors.textMuted} />
        <TextInput
          placeholder="Filter by clinic name..."
          placeholderTextColor={activeColors.textMuted}
          value={nameFilter}
          onChangeText={setNameFilter}
          style={[styles.searchInput, { color: activeColors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {nameFilter.length > 0 && (
          <TouchableOpacity onPress={() => setNameFilter('')}>
            <Ionicons name="close-circle" size={18} color={activeColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Map Component */}
      <HospitalMap
        loading={loading}
        hospitals={hospitals}
        userCoords={userCoords}
        selectedHospitalId={selectedHospitalId}
        activeColors={activeColors}
      />

      {/* Filter Pills — All Nearby + Saved only */}
      <View style={styles.pillsContainer}>
        {/* "All" pill */}
        <TouchableOpacity
          onPress={() => setShowSavedOnly(false)}
          style={[
            styles.pill,
            {
              backgroundColor: !showSavedOnly ? activeColors.primary : activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <Ionicons
            name="locate"
            size={14}
            color={!showSavedOnly ? '#fff' : activeColors.primary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.pillText,
              { color: !showSavedOnly ? '#fff' : activeColors.textMuted },
            ]}
          >
            All nearby
          </Text>
        </TouchableOpacity>

        {/* Saved pill */}
        <TouchableOpacity
          onPress={() => setShowSavedOnly(true)}
          style={[
            styles.pill,
            {
              backgroundColor: showSavedOnly ? '#C85A46' : activeColors.surface,
              borderColor: showSavedOnly ? '#C85A46' : activeColors.border,
            },
          ]}
        >
          <Ionicons
            name={showSavedOnly ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={showSavedOnly ? '#fff' : activeColors.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.pillText,
              { color: showSavedOnly ? '#fff' : activeColors.textMuted },
            ]}
          >
            Saved ({savedCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    flexShrink: 0,
    height: 52,
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
});
