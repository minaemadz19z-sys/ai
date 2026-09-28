import { db } from './index.ts';
import { conversations, transcriptTurns } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { getOrCreateUser } from './users.ts';

export interface SaveConversationInput {
  userUid: string;
  userEmail: string;
  userDisplayName?: string;
  title: string;
  voiceModel: string;
  durationSeconds: number;
  turns: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export async function saveConversation(input: SaveConversationInput) {
  try {
    const user = await getOrCreateUser(
      input.userUid,
      input.userEmail,
      input.userDisplayName
    );

    const [savedConv] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        userUid: input.userUid,
        title: input.title || 'Voice Conversation',
        voiceModel: input.voiceModel,
        durationSeconds: input.durationSeconds,
        totalTurns: input.turns.length,
      })
      .returning();

    if (input.turns.length > 0) {
      await db.insert(transcriptTurns).values(
        input.turns.map((turn) => ({
          conversationId: savedConv.id,
          role: turn.role,
          text: turn.text,
        }))
      );
    }

    return savedConv;
  } catch (error) {
    console.error('Database saveConversation failed:', error);
    throw new Error('Failed to save conversation to database.', { cause: error });
  }
}

export async function getUserConversations(userUid: string) {
  try {
    const convs = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userUid, userUid))
      .orderBy(desc(conversations.createdAt));

    return convs;
  } catch (error) {
    console.error('Database getUserConversations failed:', error);
    throw new Error('Failed to fetch user conversations.', { cause: error });
  }
}

export async function getConversationWithTurns(conversationId: number, userUid: string) {
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv || conv.userUid !== userUid) {
      return null;
    }

    const turns = await db
      .select()
      .from(transcriptTurns)
      .where(eq(transcriptTurns.conversationId, conversationId));

    return {
      ...conv,
      turns,
    };
  } catch (error) {
    console.error('Database getConversationWithTurns failed:', error);
    throw new Error('Failed to fetch conversation details.', { cause: error });
  }
}
