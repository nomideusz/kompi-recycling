import { env as publicEnv } from '$env/dynamic/public';

export const load = async () => {
	return {
		googleMapsApiKey: publicEnv.PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
		googleMapsMapId: publicEnv.PUBLIC_GOOGLE_MAPS_MAP_ID ?? '',
	};
};
