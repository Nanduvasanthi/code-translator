import mongoose from 'mongoose';

const translationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  sourceCode: { 
    type: String, 
    required: true 
  },
  translatedCode: { 
    type: String, 
    required: true 
  },
  sourceLanguage: { 
    type: String, 
    required: true 
  },
  targetLanguage: { 
    type: String, 
    required: true 
  },
  executionTime: { 
    type: Number 
  },
  confidence: { 
    type: Number 
  },
  linesOfCode: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['success', 'error','failed_unsupported','partial_success','failed'], 
    default: 'success' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Translation', translationSchema);