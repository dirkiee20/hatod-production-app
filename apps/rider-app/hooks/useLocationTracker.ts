import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import api from '@/services/api';

export function useLocationTracker(isOnline: boolean) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Initial fetch
      const current = await Location.getCurrentPositionAsync({});
      setLocation(current);
      sendLocationUpdate(current.coords.latitude, current.coords.longitude);

      // Watch
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          sendLocationUpdate(newLocation.coords.latitude, newLocation.coords.longitude);
        }
      );
    };

    if (isOnline) {
      startTracking();
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isOnline]);

  const sendLocationUpdate = async (lat: number, lng: number) => {
    try {
      await api.patch('/riders/location', { lat, lng });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  return { location, errorMsg };
}
