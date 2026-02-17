import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Mapbox from '@rnmapbox/maps';

// Set the access token
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
console.log('[RiderApp MapView] Token from env:', token ? `${token.substring(0, 10)}...` : 'undefined');
Mapbox.setAccessToken(token || '');

interface MapViewProps extends ViewProps {
  showUserLocation?: boolean;
}

export function MapView({ style, showUserLocation = true, ...props }: MapViewProps) {
  console.log('[RiderApp MapView] Rendering MapView component');
  
  return (
    <View style={[styles.container, style]} {...props}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera followZoomLevel={14} followUserLocation />
        {showUserLocation && <Mapbox.UserLocation />}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
