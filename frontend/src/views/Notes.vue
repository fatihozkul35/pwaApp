<template>
  <div class="notes">
    <div class="header">
      <h1>Notlarım</h1>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? 'İptal' : 'Yeni Not' }}
      </button>
    </div>
    
    <div v-if="showAddForm" class="add-form">
      <h3>Yeni Not Ekle</h3>
      <form @submit.prevent="addNote">
        <div class="form-group">
          <input 
            v-model="newNote.title" 
            type="text" 
            placeholder="Not başlığı" 
            required
            class="form-input"
          >
        </div>
        <div class="form-group">
          <textarea 
            v-model="newNote.content" 
            placeholder="Not içeriği"
            class="form-textarea"
            required
          ></textarea>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Ekleniyor...' : 'Not Ekle' }}
        </button>
      </form>
    </div>
    
    <div v-if="loading" class="loading">
      <p>Yükleniyor...</p>
    </div>
    
    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div class="notes-grid">
      <div 
        v-for="note in notes" 
        :key="note.id" 
        class="note-card"
      >
        <div class="note-header">
          <h3>{{ note.title }}</h3>
          <div class="note-actions">
            <button @click="editNote(note)" class="edit-btn">✏️</button>
            <button @click="deleteNote(note.id)" class="delete-btn">🗑️</button>
          </div>
        </div>
        
        <div class="note-content">
          {{ note.content }}
        </div>
        
        <div class="note-meta">
          <small>{{ formatDate(note.created_at) }}</small>
          <small v-if="note.updated_at !== note.created_at">
            (Güncellendi: {{ formatDate(note.updated_at) }})
          </small>
        </div>
      </div>
    </div>
    
    <div v-if="notes.length === 0 && !loading" class="empty-state">
      <p>Henüz not eklenmemiş. İlk notunuzu ekleyin!</p>
    </div>
    
    <!-- Edit Modal -->
    <div v-if="editingNote" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3>Notu Düzenle</h3>
        <form @submit.prevent="updateNote">
          <div class="form-group">
            <input 
              v-model="editingNote.title" 
              type="text" 
              placeholder="Not başlığı" 
              required
              class="form-input"
            >
          </div>
          <div class="form-group">
            <textarea 
              v-model="editingNote.content" 
              placeholder="Not içeriği"
              class="form-textarea"
              required
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="cancel-btn">
              İptal
            </button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? 'Güncelleniyor...' : 'Güncelle' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Notes',
  data() {
    return {
      showAddForm: false,
      newNote: {
        title: '',
        content: ''
      },
      editingNote: null
    }
  },
  computed: {
    ...mapState(['notes', 'loading', 'error'])
  },
  created() {
    this.fetchNotes()
  },
  methods: {
    ...mapActions(['fetchNotes', 'createNote', 'updateNote', 'deleteNote']),
    
    async addNote() {
      await this.createNote(this.newNote)
      this.newNote = { title: '', content: '' }
      this.showAddForm = false
    },
    
    editNote(note) {
      this.editingNote = { ...note }
    },
    
    closeEditModal() {
      this.editingNote = null
    },
    
    async updateNote() {
      await this.updateNote({
        id: this.editingNote.id,
        noteData: {
          title: this.editingNote.title,
          content: this.editingNote.content
        }
      })
      this.closeEditModal()
    },
    
    async deleteNote(noteId) {
      if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        await this.deleteNote(noteId)
      }
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.notes {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #333;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
}

.add-form {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.add-form h3 {
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.error {
  background: #f8d7da;
  color: #721c24;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.note-card {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  border-left: 4px solid #ffc107;
}

.note-card:hover {
  transform: translateY(-3px);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.note-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 1rem;
}

.note-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  background: none;
  border: 2px solid #e1e5e9;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.edit-btn:hover {
  border-color: #ffc107;
  background: #ffc107;
  color: white;
}

.delete-btn:hover {
  border-color: #dc3545;
  background: #dc3545;
  color: white;
}

.note-content {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.note-meta {
  color: #999;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  color: #666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1rem;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .notes-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
