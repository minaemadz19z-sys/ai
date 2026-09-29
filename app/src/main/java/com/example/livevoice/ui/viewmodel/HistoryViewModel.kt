package com.example.livevoice.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.livevoice.data.local.AppDatabase
import com.example.livevoice.data.local.ConversationEntity
import com.example.livevoice.data.local.TranscriptTurnEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HistoryViewModel(application: Application) : AndroidViewModel(application) {

    private val dao = AppDatabase.getInstance(application).conversationDao()

    val conversations = dao.getAllConversations().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _selectedConversationTurns = MutableStateFlow<List<TranscriptTurnEntity>>(emptyList())
    val selectedConversationTurns = _selectedConversationTurns.asStateFlow()

    private val _activeConversation = MutableStateFlow<ConversationEntity?>(null)
    val activeConversation = _activeConversation.asStateFlow()

    fun selectConversation(conv: ConversationEntity) {
        _activeConversation.value = conv
        viewModelScope.launch {
            dao.getTurnsForConversation(conv.id).collect { turns ->
                _selectedConversationTurns.value = turns
            }
        }
    }

    fun dismissDetail() {
        _activeConversation.value = null
        _selectedConversationTurns.value = emptyList()
    }

    fun deleteConversation(id: String) {
        viewModelScope.launch {
            dao.deleteConversation(id)
            if (_activeConversation.value?.id == id) {
                dismissDetail()
            }
        }
    }

    fun clearAll() {
        viewModelScope.launch {
            dao.clearAllConversations()
            dismissDetail()
        }
    }
}
