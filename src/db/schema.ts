import { pgTable, uuid, text, timestamp, unique, smallint, date, index, boolean } from 'drizzle-orm/pg-core'

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),
  settlementHour: smallint('settlement_hour').notNull().default(5),
})

export const challengeMembers = pgTable('challenge_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  weeklyGoal: smallint('weekly_goal').notNull().default(3),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  // Phase 5 SETT-02: per-user reminder hour (0-23, local time bucket); null = no daily reminder
  reminderHour: smallint('reminder_hour'),
  // Phase 5 SETT-02: explicit opt-in master switch for all push notifications
  notificationsEnabled: boolean('notifications_enabled').notNull().default(false),
}, (table) => [
  unique('challenge_members_user_id_unique').on(table.userId),
])

export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const checkIns = pgTable('check_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  photoUrl: text('photo_url').notNull(),
  checkedInDate: date('checked_in_date', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('check_ins_user_date_idx').on(t.userId, t.checkedInDate),
  index('check_ins_challenge_idx').on(t.challengeId, t.createdAt),
])

// Phase 4: Points & Stakes tables

export const settledWeeks = pgTable('settled_weeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  weekStart: date('week_start', { mode: 'string' }).notNull(),
  settledAt: timestamp('settled_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('settled_weeks_challenge_week_unique').on(t.challengeId, t.weekStart),
])

export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  weekStart: date('week_start', { mode: 'string' }).notNull(),
  delta: smallint('delta').notNull(),
  // WR-06: enum type narrows at TS-level; DB CHECK constraint enforces at runtime.
  reason: text('reason', { enum: ['earned', 'penalty', 'redemption'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('pt_challenge_user_idx').on(t.challengeId, t.userId),
])

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pointCost: smallint('point_cost').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const redemptions = pgTable('redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  // WR-02: FK with ON DELETE RESTRICT — can't delete a reward that has history.
  // point_cost is already snapshotted, so historical redemption reads stay correct.
  rewardId: uuid('reward_id').notNull().references(() => rewards.id, { onDelete: 'restrict' }),
  pointCost: smallint('point_cost').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Phase 5 SETT-02: Web Push subscriptions — one row per (user, browser/device endpoint).
// Endpoint is globally unique across all push services (FCM, APNS, Mozilla AutoPush).
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('push_subs_user_idx').on(t.userId),
])
