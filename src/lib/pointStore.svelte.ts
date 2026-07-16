import { fromWire, type WirePoint } from './wire';
import type { RecyclingPoint } from './types';
import { tileKeysForBbox } from './tiles';

export type Bbox = {
	north: number;
	south: number;
	east: number;
	west: number;
};

type TileIndex = {
	total: number;
	tiles: Record<string, number>;
};

// Above this many tiles in view the user is looking at a large chunk of the
// country — don't stream megabytes of long-tail points they can't visually
// distinguish anyway; the truncation hint asks them to zoom in instead.
// 12 tiles ≈ a 3°×4° window, comfortably more than any metro area.
const MAX_TILES_PER_VIEW = 12;

/**
 * Client-side point cache fed by prerendered static tile files
 * (/data/tiles/*.json) instead of a serverless bbox endpoint — tiles come
 * straight off the CDN, so there is no function cold start or DB wake on
 * the first pan/zoom. Tiles are complete (never capped), cumulative, and
 * deduped by slug.
 */
export class PointStore {
	#bySlug = new Map<string, RecyclingPoint>();
	#index: TileIndex | null = null;
	#indexPromise: Promise<TileIndex | null> | null = null;
	#loadedTiles = new Set<string>();
	#inflightTiles = new Map<string, Promise<boolean>>();
	#pendingCount = 0;

	points = $state<RecyclingPoint[]>([]);
	loading = $state(false);
	truncated = $state(false);
	total = $state(0);
	error = $state<string | null>(null);

	seed(initial: RecyclingPoint[], totalCount: number, initialTruncated: boolean) {
		for (const p of initial) this.#bySlug.set(p.slug, p);
		this.total = totalCount;
		this.truncated = initialTruncated;
		this.points = [...this.#bySlug.values()];
	}

	async fetchBbox(bbox: Bbox) {
		const index = await this.#ensureIndex();
		if (!index) return;

		// Tiles that exist (index lists non-empty ones only) and cover the view.
		const viewTiles = tileKeysForBbox(bbox).filter((k) => index.tiles[k] !== undefined);
		const missing = viewTiles.filter((k) => !this.#loadedTiles.has(k));

		if (missing.length === 0) {
			this.truncated = false;
			return;
		}
		if (viewTiles.length > MAX_TILES_PER_VIEW) {
			this.truncated = true;
			return;
		}

		await Promise.all(missing.map((k) => this.#fetchTile(k)));

		// Recompute against the current loaded set — a concurrent pan may have
		// loaded more (or this fetch may have partially failed).
		this.truncated = viewTiles.some((k) => !this.#loadedTiles.has(k));
	}

	#ensureIndex(): Promise<TileIndex | null> {
		if (this.#index) return Promise.resolve(this.#index);
		this.#indexPromise ??= (async () => {
			try {
				const res = await fetch('/data/tiles/index.json');
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				this.#index = (await res.json()) as TileIndex;
				this.total = this.#index.total;
				this.error = null;
				return this.#index;
			} catch (e) {
				this.error = e instanceof Error ? e.message : String(e);
				// Allow a retry on the next pan/zoom.
				this.#indexPromise = null;
				return null;
			}
		})();
		return this.#indexPromise;
	}

	/** Fetch one tile, dedup concurrent requests. Resolves true on success. */
	#fetchTile(key: string): Promise<boolean> {
		const existing = this.#inflightTiles.get(key);
		if (existing) return existing;

		const promise = (async () => {
			this.#pendingCount += 1;
			this.loading = true;
			try {
				const res = await fetch(`/data/tiles/${key}.json`);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = (await res.json()) as { points: WirePoint[] };
				for (const w of data.points) this.#bySlug.set(w.slug, fromWire(w));
				this.#loadedTiles.add(key);
				this.points = [...this.#bySlug.values()];
				this.error = null;
				return true;
			} catch (e) {
				this.error = e instanceof Error ? e.message : String(e);
				return false;
			} finally {
				this.#inflightTiles.delete(key);
				this.#pendingCount -= 1;
				this.loading = this.#pendingCount > 0;
			}
		})();

		this.#inflightTiles.set(key, promise);
		return promise;
	}
}
