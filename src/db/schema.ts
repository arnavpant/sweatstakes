import { pgTable, uuid, text, timestamp, unique, smallint, date, index } from 'drizzle-orm/pg-core'

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const challengeMembers = pgTable('challenge_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  weeklyGoal: smallint('weekly_goal').notNull().default(3),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
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
