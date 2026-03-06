export type RouteData = {
  geometry: any;
  distance: number;
  duration: number;
};

export const getRoute = async (start: [number, number], end: [number, number]): Promise<RouteData | null> => {
  try {
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${token}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      return {
        geometry: primaryRoute.geometry,
        distance: typeof primaryRoute.distance === 'number' ? primaryRoute.distance : 0,
        duration: typeof primaryRoute.duration === 'number' ? primaryRoute.duration : 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};
