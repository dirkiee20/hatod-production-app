import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrderPlaceLabel, OrderPlace, PLACE_OPTIONS } from '@/utils/place';

const ORDER_PLACE_STORAGE_KEY = 'customer_selected_order_place';

interface PlaceContextType {
  selectedPlace: OrderPlace | null;
  selectedPlaceLabel: string;
  loading: boolean;
  setSelectedPlace: (place: OrderPlace) => Promise<void>;
  clearSelectedPlace: () => Promise<void>;
}

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

const isValidPlace = (value: string): value is OrderPlace => {
  return PLACE_OPTIONS.some((option) => option.id === value);
};

export function PlaceProvider({ children }: { children: React.ReactNode }) {
  const [selectedPlace, setSelectedPlaceState] = useState<OrderPlace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlace = async () => {
      try {
        const raw = await AsyncStorage.getItem(ORDER_PLACE_STORAGE_KEY);
        if (raw && isValidPlace(raw)) {
          setSelectedPlaceState(raw);
        } else {
          setSelectedPlaceState(null);
        }
      } catch {
        setSelectedPlaceState(null);
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, []);

  const setSelectedPlace = async (place: OrderPlace) => {
    setSelectedPlaceState(place);
    await AsyncStorage.setItem(ORDER_PLACE_STORAGE_KEY, place);
  };

  const clearSelectedPlace = async () => {
    setSelectedPlaceState(null);
    await AsyncStorage.removeItem(ORDER_PLACE_STORAGE_KEY);
  };

  const selectedPlaceLabel = useMemo(
    () => getOrderPlaceLabel(selectedPlace),
    [selectedPlace],
  );

  return (
    <PlaceContext.Provider
      value={{
        selectedPlace,
        selectedPlaceLabel,
        loading,
        setSelectedPlace,
        clearSelectedPlace,
      }}
    >
      {children}
    </PlaceContext.Provider>
  );
}

export function usePlace() {
  const context = useContext(PlaceContext);
  if (!context) {
    throw new Error('usePlace must be used within a PlaceProvider');
  }
  return context;
}
