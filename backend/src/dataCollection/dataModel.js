/**
 * Single Flexible MongoDB Master Profile Model & In-Memory Fallback Engine
 * Business Profile Platform
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ProfileSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: [true, 'templateId is required'],
      trim: true,
      index: true,
    },
    subdomain: {
      type: String,
      required: [true, 'subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: [2, 'Subdomain must be at least 2 characters'],
      maxlength: [32, 'Subdomain must be maximum 32 characters'],
      match: [/^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      required: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordEnabled: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    minimize: false,
    strict: false,
  }
);

// Hash password before saving if modified
ProfileSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.passwordEnabled = true;
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
ProfileSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

export const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

// In-Memory Fallback Store (active when MongoDB is offline)
export class MemoryProfileStore {
  constructor() {
    this.profiles = new Map();
  }

  async findOne(query) {
    for (const p of this.profiles.values()) {
      let match = true;
      if (query.subdomain && p.subdomain !== query.subdomain.toLowerCase()) match = false;
      if (query.id && p.id !== query.id && p._id !== query.id) match = false;
      if (query._id && p._id !== query._id && p.id !== query._id) match = false;
      if (match) return { ...p };
    }
    return null;
  }

  async findById(id) {
    return this.findOne({ id });
  }

  async create(doc) {
    const id = 'mem_' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    
    let passwordHash = null;
    let passwordEnabled = false;
    if (doc.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(doc.password, salt);
      passwordEnabled = true;
    }

    const newDoc = {
      _id: id,
      id,
      templateId: doc.templateId,
      subdomain: doc.subdomain.toLowerCase().trim(),
      data: doc.data || {},
      passwordHash,
      passwordEnabled,
      isPublished: doc.isPublished !== undefined ? doc.isPublished : true,
      viewsCount: 0,
      createdAt: now,
      updatedAt: now
    };

    this.profiles.set(newDoc.subdomain, newDoc);
    return newDoc;
  }

  async updateById(id, updateData) {
    for (const [subdomain, p] of this.profiles.entries()) {
      if (p.id === id || p._id === id) {
        const updated = {
          ...p,
          ...updateData,
          data: { ...p.data, ...(updateData.data || {}) },
          updatedAt: new Date().toISOString()
        };
        this.profiles.set(subdomain, updated);
        return updated;
      }
    }
    return null;
  }

  async checkSubdomainExists(subdomain) {
    return this.profiles.has(subdomain.toLowerCase().trim());
  }

  async listAll() {
    return Array.from(this.profiles.values()).map(p => {
      const { passwordHash, ...safe } = p;
      return safe;
    });
  }
}

export const memoryStore = new MemoryProfileStore();

export default {
  Profile,
  memoryStore
};
