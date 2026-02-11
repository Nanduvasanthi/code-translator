// models/Compilation.js
import mongoose from 'mongoose';

const compilationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  code: { 
    type: String, 
    required: true 
  },
  language: { 
    type: String, 
    required: true 
  },
  output: { 
    type: String 
  },
  stderr: { 
    type: String 
  },
  error: { 
    type: String 
  },
  executionTime: { 
    type: Number 
  },
  memoryUsed: { 
    type: Number 
  },
  cpuTime: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['success', 'error', 'timeout', 'memory_exceeded'],
    default: 'success' 
  },
  exitCode: { 
    type: Number 
  },
  version: { 
    type: String 
  },
  isCompilation: { 
    type: Boolean,
    default: true 
  },
  isExecution: { 
    type: Boolean,
    default: false 
  },
  compilationTime: { 
    type: Number 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
compilationSchema.index({ userId: 1, createdAt: -1 });
compilationSchema.index({ language: 1 });
compilationSchema.index({ status: 1 });

export default mongoose.model('Compilation', compilationSchema);