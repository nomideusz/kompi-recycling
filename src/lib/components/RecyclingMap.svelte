<script lang="ts">
    import { untrack } from "svelte";
    import {
        MarkerClusterer,
        SuperClusterAlgorithm,
    } from "@googlemaps/markerclusterer";
    import { CATEGORIES_BY_ID } from "$lib/categories";
    import { TAKEBACKS_BY_ID } from "$lib/takebacks";
    import type { RecyclingPoint } from "$lib/types";

    let {
        points = [],
        apiKey = "",
        mapId = "",
        selectedSlug = $bindable<string | null>(null),
        onselect,
        onbounds,
    }: {
        points: RecyclingPoint[];
        apiKey: string;
        mapId?: string;
        selectedSlug?: string | null;
        onselect?: (slug: string) => void;
        onbounds?: (bounds: {
            north: number;
            south: number;
            east: number;
            west: number;
        }) => void;
    } = $props();

    let mapEl: HTMLDivElement | undefined = $state();
    let mapInstance: google.maps.Map | undefined = $state();
    // Long-lived caches: every marker we've ever built lives here keyed by
    // slug so we can re-add it to the clusterer in O(1) instead of allocating
    // a new AdvancedMarkerElement + DOM on every filter change.
    const markerBySlug = new Map<
        string,
        google.maps.marker.AdvancedMarkerElement
    >();
    const pointBySlug = new Map<string, RecyclingPoint>();
    // Slugs currently in the clusterer. Diff against the next prop to
    // compute add/remove deltas.
    let activeSlugs = new Set<string>();
    let clusterer: MarkerClusterer | undefined;
    let infoWindow: google.maps.InfoWindow | undefined;
    let userMarker: google.maps.marker.AdvancedMarkerElement | undefined;
    let userAccuracyCircle: google.maps.Circle | undefined;
    let anchorCircle: google.maps.Circle | undefined;
    let loaded = $state(false);
    let error = $state(false);
    let initialized = false;
    let lastSelectedSlug: string | null = null;

    // Poland center — used when there are no points to fit to.
    const POLAND_CENTER = { lat: 52.07, lng: 19.48 };
    const POLAND_ZOOM = 6;

    function loadGoogleMaps(): Promise<void> {
        const hasBase = !!(window as any).google?.maps?.Map;
        const hasMarker = !!(window as any).google?.maps?.marker
            ?.AdvancedMarkerElement;
        if (hasBase && hasMarker) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const done = async () => {
                try {
                    await (window as any).google.maps.importLibrary("maps");
                    await (window as any).google.maps.importLibrary("marker");
                    resolve();
                } catch (e) {
                    reject(e instanceof Error ? e : new Error(String(e)));
                }
            };
            if (hasBase) {
                done();
                return;
            }
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if ((window as any).google?.maps?.Map) done();
                else
                    reject(
                        new Error("Google Maps loaded but API not available"),
                    );
            };
            script.onerror = () =>
                reject(new Error("Failed to load Google Maps script"));
            document.head.appendChild(script);
        });
    }

    function markerColor(p: RecyclingPoint): string {
        const primary = p.categories[0];
        switch (primary) {
            case "weee":
                return "#0778c1"; // Blue
            case "small":
                return "#0560a0"; // Dark Blue
            case "battery":
                return "#f97e21"; // Orange
            case "lamp":
                return "#e06d12"; // Dark Orange
            case "mobile":
                return "#272d2e"; // Dark
            default:
                return "#0778c1";
        }
    }

    function escapeHtml(s: string): string {
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function popupHtml(p: RecyclingPoint): string {
        const chips = p.categories
            .map((id) => {
                const cat = CATEGORIES_BY_ID[id];
                if (!cat) return "";
                return `<span class="kp-chip"><span class="kp-dot" style="background: var(${cat.colorVar})"></span>${escapeHtml(cat.label)}</span>`;
            })
            .join("");
        const tb = TAKEBACKS_BY_ID[p.takebackType];
        const takeback = tb
            ? `<div class="kp-takeback" title="${escapeHtml(tb.description)}"><span class="kp-tb-dot" style="background: var(--kompi-tb-${tb.id})"></span>${escapeHtml(tb.label)}</div>`
            : "";
        const hours = p.hours
            ? `<div class="kp-row kp-hours">${escapeHtml(p.hours)}</div>`
            : "";
        const notes = p.notes
            ? `<div class="kp-note" role="note">${escapeHtml(p.notes)}</div>`
            : "";
        return `
      <div class="kp-pop">
        <div class="kp-title">${escapeHtml(p.name)}</div>
        <div class="kp-op">${escapeHtml(p.operator || "")}</div>
        <div class="kp-addr">${escapeHtml(p.address)}, ${escapeHtml(p.postalCode)} ${escapeHtml(p.city)}</div>
        ${takeback}
        ${hours}
        <div class="kp-chips">${chips}</div>
        ${notes}
        <a class="kp-link" href="/punkt/${encodeURIComponent(p.slug)}" data-sveltekit-preload-data="hover">Szczegóły punktu →</a>
      </div>
    `;
    }

    // Category glyphs — Lucide icons (24x24), scaled down to fit in disc.
    const CATEGORY_GLYPHS: Record<string, string> = {
        weee: '<rect width="20" height="14" x="2" y="3" rx="2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" x2="16" y1="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" x2="12" y1="17" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        small: '<rect x="5" y="2" width="14" height="20" rx="7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        battery:
            '<path d="M 22 14 L 22 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        lamp: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 22h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        mobile: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 18H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    };

    function buildMarkerPin(
        p: RecyclingPoint,
        selected: boolean,
    ): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.className = selected ? "kp-pin kp-pin--selected" : "kp-pin";
        wrapper.style.setProperty("--kp-pin-color", markerColor(p));
        const glyph = CATEGORY_GLYPHS[p.categories[0]] ?? "";
        // Teardrop pin: body path + white disc + category glyph centered in disc.
        wrapper.innerHTML = `
      <svg class="kp-pin__svg" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="kp-pin__body" d="M16 1.5c-7.456 0-13.5 5.94-13.5 13.272 0 4.104 1.928 8.084 4.512 11.63 2.59 3.553 5.88 6.77 8.013 8.714a1.47 1.47 0 0 0 1.95 0c2.133-1.944 5.422-5.161 8.013-8.714 2.584-3.546 4.512-7.526 4.512-11.63C29.5 7.44 23.456 1.5 16 1.5z"/>
        <circle class="kp-pin__disc" cx="16" cy="14.75" r="7.5"/>
        <g class="kp-pin__glyph" transform="translate(10 8.75) scale(0.5)" color="var(--kp-pin-color)">${glyph}</g>
      </svg>
    `;
        return wrapper;
    }

    function clusterRenderer() {
        return {
            render({
                count,
                position,
            }: {
                count: number;
                position: google.maps.LatLng;
            }) {
                const size = Math.min(48, 26 + Math.sqrt(count) * 2.8);
                const el = document.createElement("div");
                el.className = "kp-cluster";
                el.style.width = `${size}px`;
                el.style.height = `${size}px`;
                el.innerHTML = `
          <span class="kp-cluster__ring" aria-hidden="true"></span>
          <span class="kp-cluster__num">${count}</span>
        `;
                return new google.maps.marker.AdvancedMarkerElement({
                    position,
                    content: el,
                    zIndex: 1000 + count,
                });
            },
        };
    }

    function fitToPoints() {
        if (!mapInstance) return;
        if (points.length === 0) {
            mapInstance.setCenter(POLAND_CENTER);
            mapInstance.setZoom(POLAND_ZOOM);
            return;
        }
        if (points.length === 1) {
            mapInstance.setCenter({ lat: points[0].lat, lng: points[0].lng });
            mapInstance.setZoom(13);
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        for (const p of points) bounds.extend({ lat: p.lat, lng: p.lng });
        mapInstance.fitBounds(bounds, {
            top: 80,
            bottom: 40,
            left: 400,
            right: 40,
        });
    }

    function initMap() {
        if (!mapEl || initialized) return;
        initialized = true;

        mapInstance = new google.maps.Map(mapEl, {
            center: POLAND_CENTER,
            zoom: POLAND_ZOOM,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            mapId: mapId || undefined,
            styles: mapId
                ? undefined
                : [
                      {
                          elementType: "geometry",
                          stylers: [{ color: "#242f3e" }],
                      },
                      {
                          elementType: "labels.text.stroke",
                          stylers: [{ color: "#242f3e" }],
                      },
                      {
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#746855" }],
                      },
                      {
                          featureType: "administrative.locality",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#d59563" }],
                      },
                      {
                          featureType: "poi",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#d59563" }],
                      },
                      {
                          featureType: "poi.park",
                          elementType: "geometry",
                          stylers: [{ color: "#263c3f" }],
                      },
                      {
                          featureType: "poi.park",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#6b9a76" }],
                      },
                      {
                          featureType: "road",
                          elementType: "geometry",
                          stylers: [{ color: "#38414e" }],
                      },
                      {
                          featureType: "road",
                          elementType: "geometry.stroke",
                          stylers: [{ color: "#212a37" }],
                      },
                      {
                          featureType: "road",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#9ca5b3" }],
                      },
                      {
                          featureType: "road.highway",
                          elementType: "geometry",
                          stylers: [{ color: "#746855" }],
                      },
                      {
                          featureType: "road.highway",
                          elementType: "geometry.stroke",
                          stylers: [{ color: "#1f2835" }],
                      },
                      {
                          featureType: "road.highway",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#f3d19c" }],
                      },
                      {
                          featureType: "transit",
                          elementType: "geometry",
                          stylers: [{ color: "#2f3948" }],
                      },
                      {
                          featureType: "transit.station",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#d59563" }],
                      },
                      {
                          featureType: "water",
                          elementType: "geometry",
                          stylers: [{ color: "#17263c" }],
                      },
                      {
                          featureType: "water",
                          elementType: "labels.text.fill",
                          stylers: [{ color: "#515c6d" }],
                      },
                      {
                          featureType: "water",
                          elementType: "labels.text.stroke",
                          stylers: [{ color: "#17263c" }],
                      },
                  ],
        });

        infoWindow = new google.maps.InfoWindow({ disableAutoPan: false });
        infoWindow.addListener("closeclick", () => {
            if (selectedSlug) selectedSlug = null;
        });

        clusterer = new MarkerClusterer({
            map: mapInstance,
            renderer: clusterRenderer(),
            algorithm: new SuperClusterAlgorithm({ radius: 80, maxZoom: 16 }),
        });

        // The idle event fires after pan/zoom settles — no debounce needed
        // on top. Parent uses these bounds to drive bbox-fetching.
        if (onbounds) {
            mapInstance.addListener("idle", () => {
                const b = mapInstance!.getBounds();
                if (!b) return;
                const ne = b.getNorthEast();
                const sw = b.getSouthWest();
                onbounds({
                    north: ne.lat(),
                    south: sw.lat(),
                    east: ne.lng(),
                    west: sw.lng(),
                });
            });
        }

        fitToPoints();
        reconcileMarkers();
    }

    function openPopup(
        p: RecyclingPoint,
        marker: google.maps.marker.AdvancedMarkerElement,
    ) {
        if (!infoWindow || !mapInstance) return;
        infoWindow.setContent(popupHtml(p));
        infoWindow.open({ anchor: marker, map: mapInstance });
    }

    function createMarkerFor(
        p: RecyclingPoint,
        selected: boolean,
    ): google.maps.marker.AdvancedMarkerElement {
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: p.lat, lng: p.lng },
            title: `${p.name} — ${p.city}`,
            content: buildMarkerPin(p, selected),
            gmpClickable: true,
        });
        marker.addEventListener("gmp-click", () => {
            onselect?.(p.slug);
            selectedSlug = p.slug;
            openPopup(p, marker);
        });
        return marker;
    }

    /**
     * Reconcile the clusterer's marker set against the current `points` prop.
     * Markers are created lazily on first sight and cached forever — subsequent
     * filter changes only toggle clusterer membership for the slugs that
     * actually entered or left the visible set. Avoids the 10k DOM allocation
     * cost of the previous "clear and rebuild" path.
     */
    function reconcileMarkers() {
        if (!mapInstance || !clusterer) return;

        const nextSlugs = new Set<string>();
        const toAdd: google.maps.marker.AdvancedMarkerElement[] = [];
        const toRemove: google.maps.marker.AdvancedMarkerElement[] = [];
        const currentSelected = selectedSlug;

        for (const p of points) {
            nextSlugs.add(p.slug);
            pointBySlug.set(p.slug, p);
            let marker = markerBySlug.get(p.slug);
            if (!marker) {
                marker = createMarkerFor(p, p.slug === currentSelected);
                markerBySlug.set(p.slug, marker);
            }
            if (!activeSlugs.has(p.slug)) toAdd.push(marker);
        }

        for (const slug of activeSlugs) {
            if (nextSlugs.has(slug)) continue;
            const m = markerBySlug.get(slug);
            if (m) toRemove.push(m);
        }

        // Batch the diff into a single re-cluster pass.
        if (toRemove.length > 0) clusterer.removeMarkers(toRemove, true);
        if (toAdd.length > 0) clusterer.addMarkers(toAdd, true);
        if (toRemove.length > 0 || toAdd.length > 0) clusterer.render();

        activeSlugs = nextSlugs;

        if (currentSelected && nextSlugs.has(currentSelected)) {
            const p = pointBySlug.get(currentSelected);
            const m = markerBySlug.get(currentSelected);
            if (p && m) openPopup(p, m);
        } else {
            infoWindow?.close();
        }
        lastSelectedSlug = currentSelected ?? null;
    }

    function applySelectionStyle(slug: string | null, selected: boolean) {
        if (!slug) return;
        const marker = markerBySlug.get(slug);
        const p = pointBySlug.get(slug);
        if (!marker || !p) return;
        const el = marker.content as HTMLElement | null;
        if (el && el.classList) {
            el.classList.toggle("kp-pin--selected", selected);
        } else {
            marker.content = buildMarkerPin(p, selected);
        }
    }

    function updateSelection(prev: string | null, next: string | null) {
        applySelectionStyle(prev, false);
        applySelectionStyle(next, true);
        if (next) {
            const p = pointBySlug.get(next);
            const m = markerBySlug.get(next);
            if (p && m) openPopup(p, m);
        } else {
            infoWindow?.close();
        }
    }

    $effect(() => {
        if (!apiKey || !mapEl) return;
        loadGoogleMaps()
            .then(() => {
                loaded = true;
                initMap();
            })
            .catch((err) => {
                console.error("[RecyclingMap]", err);
                error = true;
            });
    });

    // Reconcile clusterer membership when the visible point set changes.
    // `selectedSlug` read inside reconcileMarkers is untracked so re-selecting
    // a point doesn't trigger reconciliation.
    $effect(() => {
        void points;
        if (!loaded || !mapInstance) return;
        untrack(() => {
            reconcileMarkers();
        });
    });

    // Lightweight selection updates: restyle the two affected markers + swap
    // the info window. No marker churn, no clusterer rework.
    $effect(() => {
        const next = selectedSlug ?? null;
        if (!loaded || !mapInstance) return;
        if (next === lastSelectedSlug) return;
        untrack(() => {
            updateSelection(lastSelectedSlug, next);
            lastSelectedSlug = next;
        });
    });

    export function panTo(lat: number, lng: number, zoom = 13) {
        if (!mapInstance) return;
        mapInstance.panTo({ lat, lng });
        if (mapInstance.getZoom()! < zoom) mapInstance.setZoom(zoom);
    }

    export function setAnchor(
        lat: number,
        lng: number,
        radiusKm: number | null,
    ) {
        if (!mapInstance) return;
        if (radiusKm == null) {
            anchorCircle?.setMap(null);
            anchorCircle = undefined;
            return;
        }
        const radiusMeters = radiusKm * 1000;
        if (!anchorCircle) {
            anchorCircle = new google.maps.Circle({
                map: mapInstance,
                center: { lat, lng },
                radius: radiusMeters,
                fillColor: "#0778c1",
                fillOpacity: 0.06,
                strokeColor: "#0778c1",
                strokeOpacity: 0.5,
                strokeWeight: 1.5,
                clickable: false,
            });
        } else {
            anchorCircle.setCenter({ lat, lng });
            anchorCircle.setRadius(radiusMeters);
            anchorCircle.setMap(mapInstance);
        }
    }

    export function clearAnchor() {
        anchorCircle?.setMap(null);
        anchorCircle = undefined;
    }

    export function setUserLocation(
        lat: number,
        lng: number,
        accuracy?: number,
    ) {
        if (!mapInstance) return;
        const pos = { lat, lng };

        if (!userMarker) {
            const el = document.createElement("div");
            el.className = "kp-user-dot";
            userMarker = new google.maps.marker.AdvancedMarkerElement({
                position: pos,
                map: mapInstance,
                zIndex: 9999,
                content: el,
                gmpClickable: false,
            });
        } else {
            userMarker.position = pos;
        }

        if (accuracy && accuracy > 0) {
            if (!userAccuracyCircle) {
                userAccuracyCircle = new google.maps.Circle({
                    map: mapInstance,
                    center: pos,
                    radius: accuracy,
                    fillColor: "#1a73e8",
                    fillOpacity: 0.12,
                    strokeColor: "#1a73e8",
                    strokeOpacity: 0.3,
                    strokeWeight: 1,
                    clickable: false,
                });
            } else {
                userAccuracyCircle.setCenter(pos);
                userAccuracyCircle.setRadius(accuracy);
            }
        }
    }
</script>

{#if !apiKey}
    <div class="map-fallback">
        <p>
            Konfiguracja: ustaw <code>PUBLIC_GOOGLE_MAPS_API_KEY</code> aby zobaczyć
            mapę.
        </p>
    </div>
{:else if error}
    <div class="map-fallback">
        <p>Nie udało się załadować mapy. Spróbuj ponownie później.</p>
    </div>
{:else}
    <div
        bind:this={mapEl}
        class="map"
        aria-label="Mapa punktów zbiórki elektroodpadów"
    ></div>
{/if}

<style>
    .map {
        width: 100%;
        height: 100%;
        background: var(--kompi-bg);
    }
    .map-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: var(--kompi-space-6);
        background: var(--kompi-surface);
        color: var(--kompi-text-2);
        text-align: center;
    }
    code {
        font-family: var(--kompi-font-mono);
        font-size: 13px;
        padding: 2px 6px;
        background: var(--kompi-bg);
        border-radius: var(--kompi-radius-sm);
    }

    /* Marker + InfoWindow content is injected by Google Maps into the document —
     has to be global for styles to apply. */

    /* Teardrop pin with category glyph. The svg is 32×42; AdvancedMarkerElement
     anchors at the bottom-center of content, so the tip sits on the coordinate. */
    :global(.kp-pin) {
        width: 30px;
        height: 40px;
        transform-origin: 50% 100%;
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.28));
        cursor: pointer;
        transition:
            transform 140ms cubic-bezier(0.2, 0.7, 0.2, 1.2),
            filter 140ms ease;
        will-change: transform;
    }
    :global(.kp-pin:hover) {
        transform: scale(1.12) translateY(-1px);
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.32));
    }
    :global(.kp-pin--selected) {
        transform: scale(1.22) translateY(-2px);
        filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35));
        z-index: 2;
    }
    :global(.kp-pin__svg) {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
    }
    :global(.kp-pin__body) {
        fill: var(--kp-pin-color, #2f855a);
        stroke: #ffffff;
        stroke-width: 1.5;
    }
    :global(.kp-pin__disc) {
        fill: #ffffff;
    }
    :global(.kp-pin__glyph) {
        color: var(--kp-pin-color, #2f855a);
    }
    :global(.kp-pin--selected .kp-pin__body) {
        stroke-width: 2;
    }

    /* Cluster: tighter ring + bold number. */
    :global(.kp-cluster) {
        position: relative;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #0778c1;
        color: #ffffff;
        font-family: var(--kompi-font-sans);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.01em;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
        cursor: pointer;
        transform-origin: center;
        transition: transform 140ms cubic-bezier(0.2, 0.7, 0.2, 1.2);
        will-change: transform;
    }
    :global(.kp-cluster:hover) {
        transform: scale(1.08);
    }
    :global(.kp-cluster__ring) {
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        background: rgba(7, 120, 193, 0.22);
        pointer-events: none;
    }
    :global(.kp-cluster__num) {
        position: relative;
        line-height: 1;
    }

    /* User location: dot + soft pulse. */
    :global(.kp-user-dot) {
        position: relative;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #1a73e8;
        border: 3px solid #ffffff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }
    :global(.kp-user-dot::before) {
        content: "";
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        background: rgba(26, 115, 232, 0.25);
        animation: kp-pulse 1.8s ease-out infinite;
    }
    @keyframes kp-pulse {
        0% {
            transform: scale(0.7);
            opacity: 0.8;
        }
        100% {
            transform: scale(1.6);
            opacity: 0;
        }
    }

    :global(.kp-pop) {
        font-family: var(--kompi-font-sans);
        min-width: 220px;
        max-width: 280px;
        padding: 4px 2px 2px;
    }
    :global(.kp-pop .kp-title) {
        font-size: 15px;
        font-weight: 600;
        color: var(--kompi-text);
        margin-bottom: 2px;
        line-height: 1.3;
    }
    :global(.kp-pop .kp-op) {
        font-size: 12px;
        color: var(--kompi-text-3);
        margin-bottom: 8px;
    }
    :global(.kp-pop .kp-op:empty) {
        display: none;
    }
    :global(.kp-pop .kp-addr) {
        font-size: 13px;
        color: var(--kompi-text-2);
        margin-bottom: 6px;
        line-height: 1.4;
    }
    :global(.kp-pop .kp-hours) {
        font-family: var(--kompi-font-mono);
        font-size: 12px;
        color: var(--kompi-text-3);
        margin-bottom: 8px;
    }
    :global(.kp-pop .kp-takeback) {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 8px;
        padding: 3px 9px;
        font-size: 11px;
        font-weight: 600;
        color: var(--kompi-text);
        background: var(--kompi-bg);
        border-radius: var(--kompi-radius-pill);
    }
    :global(.kp-pop .kp-tb-dot) {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }
    :global(.kp-pop .kp-chips) {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 10px;
    }
    :global(.kp-pop .kp-note) {
        font-size: 12px;
        line-height: 1.4;
        color: var(--kompi-text-2);
        background: var(--kompi-accent-subtle);
        border-left: 3px solid var(--kompi-accent);
        padding: 6px 10px;
        border-radius: 2px 6px 6px 2px;
        margin-bottom: 10px;
    }
    :global(.kp-pop .kp-chip) {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 8px;
        font-size: 11px;
        color: var(--kompi-text-2);
        background: var(--kompi-bg);
        border-radius: var(--kompi-radius-pill);
        white-space: nowrap;
    }
    :global(.kp-pop .kp-dot) {
        width: 5px;
        height: 5px;
        border-radius: 50%;
    }
    :global(.kp-pop .kp-link) {
        display: inline-block;
        font-size: 13px;
        font-weight: 500;
        color: var(--kompi-accent);
        text-decoration: none;
        padding: 2px 0;
    }
    :global(.kp-pop .kp-link:hover) {
        color: var(--kompi-accent-hover);
        text-decoration: underline;
    }
    /* Tone down Google's default InfoWindow chrome. */
    :global(.gm-style-iw-c) {
        background-color: var(--kompi-surface) !important;
        padding: 10px 12px !important;
        border-radius: var(--kompi-radius) !important;
        box-shadow: var(--kompi-shadow-lg) !important;
    }
    :global(.gm-style-iw-tc::after) {
        background: var(--kompi-surface) !important;
    }
    :global(.gm-style-iw-d) {
        overflow: visible !important;
    }
    :global(.gm-ui-hover-effect > span) {
        background-color: var(--kompi-text-2) !important;
    }
    :global(.gm-ui-hover-effect img) {
        filter: invert(1) brightness(2) !important;
    }
</style>
