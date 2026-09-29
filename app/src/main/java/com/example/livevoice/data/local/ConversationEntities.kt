package com.example.livevoice.data.local

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "conversations")
data class ConversationEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val voiceModel: String,
    val personaId: String,
    val durationSeconds: Long,
    val totalTurns: Int,
    val summary: String?,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "transcript_turns",
    foreignKeys = [
        ForeignKey(
            entity = ConversationEntity::class,
            parentColumns = ["id"],
            childColumns = ["conversationId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["conversationId"])]
)
data class TranscriptTurnEntity(
    @PrimaryKey
    val id: String,
    val conversationId: String,
    val role: String, // "user" or "model"
    val text: String,
    val timestamp: Long
)

@Entity(tableName = "user_memory")
data class UserMemoryEntity(
    @PrimaryKey
    val id: String = "primary_user",
    val name: String,
    val primaryLanguage: String,
    val englishLevel: String,
    val factsJson: String,
    val interestsJson: String,
    val goalsJson: String,
    val culturalTopicsJson: String,
    val totalSessions: Int,
    val totalDurationSeconds: Long,
    val lastSummary: String?,
    val updatedAt: Long
)
