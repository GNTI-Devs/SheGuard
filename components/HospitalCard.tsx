import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Hospital } from './HospitalMap';

interface HospitalCardProps {
  item: Hospital;
  isSelected: boolean;
  isSaved: boolean;
  searchedArea: string;
  onSelect: (h: Hospital) => void;
  onToggleSave: (id: string) => void;
  onCall: (phone: string) => void;
  activeColors: {
    surface: string;
    border: string;
    primary: string;
    primaryMuted: string;
    surface2: string;
    text: string;
    textMuted: string;
  };
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

export function HospitalCard({
  item,
  isSelected,
  isSaved,
  searchedArea,
  onSelect,
  onToggleSave,
  onCall,
  activeColors,
}: HospitalCardProps) {
  const features = buildFeatures(item.tags);

  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={[
        styles.hospitalCard,
        {
          backgroundColor: activeColors.surface,
          borderColor: isSelected ? activeColors.primary : activeColors.border,
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
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {/* Bookmark/Save button */}
          <TouchableOpacity
            onPress={() => onToggleSave(item.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.bookmarkBtn}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? '#C85A46' : activeColors.textMuted}
            />
          </TouchableOpacity>
          {/* Call button */}
          <TouchableOpacity
            onPress={() => onCall(item.phone)}
            style={[
              styles.callButton,
              { backgroundColor: activeColors.primary },
            ]}
          >
            <Ionicons name="call" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address detail */}
      <View style={styles.addressRow}>
        <Ionicons
          name="location-outline"
          size={13}
          color={activeColors.textMuted}
        />
        <Text
          style={[styles.hospitalAddress, { color: activeColors.textMuted }]}
          numberOfLines={2}
        >
          {item.address || `Located in ${searchedArea}`}
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
            style={[styles.hoursText, { color: activeColors.textMuted }]}
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
                    i === 0 ? activeColors.primary : activeColors.textMuted,
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
}

const styles = StyleSheet.create({
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
  bookmarkBtn: {
    width: 32,
    height: 32,
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
    fontSize: 13,
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
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
