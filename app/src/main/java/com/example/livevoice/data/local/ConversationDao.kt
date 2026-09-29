package com.example.livevoice.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface ConversationDao {
    @Query("SELECT * FROM conversations ORDER BY createdAt DESC")
    fun getAllConversations(): Flow<List<ConversationEntity>>

    @Query("SELECT * FROM conversations WHERE id = :id LIMIT 1")
    suspend fun getConversationById(id: String): ConversationEntity?

    @Query("SELECT * FROM transcript_turns WHERE conversationId = :conversationId ORDER BY timestamp ASC")
    fun getTurnsForConversation(conversationId: String): Flow<List<TranscriptTurnEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversation(conversation: ConversationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTurns(turns: List<TranscriptTurnEntity>)

    @Transaction
    suspend fun saveFullConversation(conversation: ConversationEntity, turns: List<TranscriptTurnEntity>) {
        insertConversation(conversation)
        if (turns.isNotEmpty()) {
            insertTurns(turns)
        }
    }

    @Query("DELETE FROM conversations WHERE id = :id")
    suspend fun deleteConversation(id: String)

    @Query("DELETE FROM conversations")
    suspend fun clearAllConversations()

    // User Memory Operations
    @Query("SELECT * FROM user_memory WHERE id = 'primary_user' LIMIT 1")
    suspend fun getUserMemory(): UserMemoryEntity?

    @Query("SELECT * FROM user_memory WHERE id = 'primary_user' LIMIT 1")
    fun observeUserMemory(): Flow<UserMemoryEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveUserMemory(memory: UserMemoryEntity)
}
