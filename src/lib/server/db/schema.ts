import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const recyclingPoints = sqliteTable(
  'recycling_points',
  {
    slug: text('slug').primaryKey(),
    googlePlaceId: text('google_place_id').unique(),

    name: text('name').notNull(),
    operator: text('operator').default(''),
    city: text('city').notNull(),
    address: text('address').default(''),
    postalCode: text('postal_code').default(''),

    lat: real('lat').notNull(),
    lng: real('lng').notNull(),

    // JSON array of CategoryId values (e.g. ["weee","small","battery"])
    categoriesJson: text('categories_json').notNull().default('[]'),

    hours: text('hours').default(''),
    phone: text('phone'),
    website: text('website'),
    notes: text('notes'),

    // Provenance — 'google-places' | 'manual' | 'bdo' | future sources
    source: text('source').notNull().default('manual'),

    // What kind of take-back channel this is, from a consumer's perspective.
    // free_dropbox     — drop electronics in a bin, no purchase needed
    // purchase_required — retail 1:1 take-back, you must buy a replacement
    // municipal        — PSZOK / municipal recycling centre
    // mobile_event     — scheduled mobile/objazdowe collection
    takebackType: text('takeback_type').notNull().default('municipal'),

    lastSeen: text('last_seen').default(sql`(CURRENT_TIMESTAMP)`),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    idxCity: index('idx_recycling_points_city').on(table.city),
  }),
);

export type RecyclingPointRow = typeof recyclingPoints.$inferSelect;
