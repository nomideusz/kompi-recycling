import { fromWire, type WirePoint } from './wire';
import type { RecyclingPoint } from './types';

export type Bbox = {
	north: number;
	south: number;
	east: number;
	west: number;
};

type FetchResponse = {
	points: WirePoint[];
	truncated: boolean;
	total: number;
};

export class PointStore {
	#bySlug = new Map<string, RecyclingPoint>();
	#lastFetched: { bbox: Bbox; truncated: boolean } | null = null;
	#inflight: AbortController | null = null;

	points = $state<RecyclingPoint[]>([]);
	loading = $state(false);
	truncated = $state(false);
	total = $state(0);
	error = $state<string | null>(null);

	seed(initial: RecyclingPoint[], totalCount: number, initialBbox: Bbox, initialTruncated: boolean) {
		for (const p of initial) this.#bySlug.set(p.slug, p);
		this.total = totalCount;
		this.truncated = initialTruncated;
		this.#lastFetched = { bbox: initialBbox, truncated: initialTruncated };
		this.points = [...this.#bySlug.values()];
	}

	async fetchBbox(bbox: Bbox) {
		// Skip if a previous (non-truncated) fetch fully covers the current view.
		// Truncated fetches don't count as coverage — a closer zoom may reveal
		// points the cap dropped last time.
		if (
			this.#lastFetched &&
			!this.#lastFetched.truncated &&
			bboxContains(this.#lastFetched.bbox, bbox)
		) {
			return;
		}

		this.#inflight?.abort();
		const controller = new AbortController();
		this.#inflight = controller;

		this.loading = true;
		this.error = null;
		try {
			const url = `/api/points?n=${bbox.north}&s=${bbox.south}&e=${bbox.east}&w=${bbox.west}`;
			const res = await fetch(url, { signal: controller.signal });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as FetchResponse;
			for (const w of data.points) this.#bySlug.set(w.slug, fromWire(w));
			this.truncated = data.truncated;
			this.#lastFetched = { bbox, truncated: data.truncated };
			this.points = [...this.#bySlug.values()];
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			if (this.#inflight === controller) this.#inflight = null;
			this.loading = false;
		}
	}
}

function bboxContains(outer: Bbox, inner: Bbox): boolean {
	return (
		outer.north >= inner.north &&
		outer.south <= inner.south &&
		outer.east >= inner.east &&
		outer.west <= inner.west
	);
}
