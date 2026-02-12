export const getRoute = async (start: [number, number], end: [number, number]): Promise<any> => {
  try {
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${token}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};
