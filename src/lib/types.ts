export type CategoryId =
	| 'weee'
	| 'battery'
	| 'lamp'
	| 'small'
	| 'mobile';

export type Category = {
	id: CategoryId;
	/** Polish label shown in UI */
	label: string;
	/** Short description */
	description: string;
	/** CSS color variable name (defined in app.css) */
	colorVar: string;
};

export type RecyclingPoint = {
	/** URL slug — unique */
	slug: string;
	name: string;
	/** Operator — e.g. "PSZOK", "Biedronka", "MPO Warszawa" */
	operator: string;
	city: string;
	address: string;
	postalCode: string;
	lat: number;
	lng: number;
	/** What the point accepts */
	categories: CategoryId[];
	/** Opening hours, free-form string or weekly schedule — free-form for now */
	hours: string;
	phone?: string;
	website?: string;
	/** Optional notes — capacity limits, ID required, etc. */
	notes?: string;
};

export type CityMarker = {
	city: string;
	lat: number;
	lng: number;
	count: number;
};
