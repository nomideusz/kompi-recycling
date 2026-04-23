/**
 * Slim over-the-wire shape for RecyclingPoint. Server omits any string
 * field that is empty / null; the client rehydrates defaults once via
 * `fromWire`. Field names match RecyclingPoint so devalue/JSON output
 * stays human-readable in DevTools — the saving comes from dropping the
 * `,"operator":"","address":"","hours":""` chunks that thousands of rows
 * carry around for no reason.
 */
import type { CategoryId, RecyclingPoint, TakebackType } from './types';

export type WirePoint = {
	slug: string;
	name: string;
	city: string;
	lat: number;
	lng: number;
	categories: CategoryId[];
	takebackType: TakebackType;
	operator?: string;
	address?: string;
	postalCode?: string;
	hours?: string;
	phone?: string;
	website?: string;
	notes?: string;
};

export function toWire(p: RecyclingPoint): WirePoint {
	const w: WirePoint = {
		slug: p.slug,
		name: p.name,
		city: p.city,
		lat: p.lat,
		lng: p.lng,
		categories: p.categories,
		takebackType: p.takebackType,
	};
	if (p.operator) w.operator = p.operator;
	if (p.address) w.address = p.address;
	if (p.postalCode) w.postalCode = p.postalCode;
	if (p.hours) w.hours = p.hours;
	if (p.phone) w.phone = p.phone;
	if (p.website) w.website = p.website;
	if (p.notes) w.notes = p.notes;
	return w;
}

export function fromWire(w: WirePoint): RecyclingPoint {
	return {
		slug: w.slug,
		name: w.name,
		city: w.city,
		lat: w.lat,
		lng: w.lng,
		categories: w.categories,
		takebackType: w.takebackType,
		operator: w.operator ?? '',
		address: w.address ?? '',
		postalCode: w.postalCode ?? '',
		hours: w.hours ?? '',
		phone: w.phone,
		website: w.website,
		notes: w.notes,
	};
}
