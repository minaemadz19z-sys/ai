import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  voiceModel: text('voice_model').notNull(),
  durationSeconds: integer('duration_seconds').default(0),
  totalTurns: integer('total_turns').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transcriptTurns = pgTable('transcript_turns', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => conversations.id)
    .notNull(),
  role: text('role').notNull(), // 'user' | 'model'
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  turns: many(transcriptTurns),
}));

export const transcriptTurnsRelations = relations(transcriptTurns, ({ one }) => ({
  conversation: one(conversations, {
    fields: [transcriptTurns.conversationId],
    references: [conversations.id],
  }),
}));
