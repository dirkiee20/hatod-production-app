import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getAuthToken } from '@/api/client';
import { usePlace } from '@/context/PlaceContext';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { selectedPlace, loading: placeLoading } = usePlace();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getAuthToken();
    setAuthenticated(!!token);
    setLoading(false);
  };

  if (loading || placeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5c6cc9" />
      </View>
    );
  }

  if (!authenticated) {
    return <Redirect href="/login" />;
  }

  if (!selectedPlace) {
    return <Redirect href="/select-place" />;
  }

  return <Redirect href="/(tabs)" />;
}
