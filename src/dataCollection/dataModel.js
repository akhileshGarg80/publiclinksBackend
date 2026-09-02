/**
 * Single Flexible MongoDB Master Profile Model
 * 
 * Stores master profile data under a flexible schema.
 * All templates share this single document structure.
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
      select: false, // Hidden by default from queries for security
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
    minimize: false, // Ensures empty objects are preserved
    strict: false,   // Allows flexible master data dictionary
  }
);

// Method to verify password against bcrypt hash
ProfileSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform to remove sensitive information on serialization
ProfileSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

// Create Mongoose model or retrieve if already registered
export const Profile = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

// In-memory fallback repository for local offline testing when MongoDB Atlas URI is not connected
export class InMemoryProfileStore {
  constructor() {
    this.profiles = new Map();
  }

  async findOne(filter) {
    for (const item of this.profiles.values()) {
      let matches = true;
      if (filter.subdomain && item.subdomain !== filter.subdomain.toLowerCase()) matches = false;
      if (filter._id && String(item._id) !== String(filter._id)) matches = false;
      if (matches) {
        return {
          ...item,
          async comparePassword(pwd) {
            if (!item.passwordHash) return false;
            return bcrypt.compare(pwd, item.passwordHash);
          },
          toJSON() {
            const copy = { ...item };
            delete copy.passwordHash;
            return copy;
          }
        };
      }
    }
    return null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async exists(filter) {
    const found = await this.findOne(filter);
    return Boolean(found);
  }

  async create(payload) {
    const _id = 'mem_' + Math.random().toString(36).substring(2, 11);
    const now = new Date();
    const doc = {
      _id,
      ...payload,
      subdomain: payload.subdomain.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.set(doc.subdomain, doc);
    return {
      ...doc,
      async comparePassword(pwd) {
        if (!doc.passwordHash) return false;
        return bcrypt.compare(pwd, doc.passwordHash);
      },
      toJSON() {
        const copy = { ...doc };
        delete copy.passwordHash;
        return copy;
      }
    };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    for (const [subdomain, item] of this.profiles.entries()) {
      if (String(item._id) === String(id)) {
        const mergedData = { ...(item.data || {}), ...(update.data || {}) };
        const updated = {
          ...item,
          ...update,
          data: mergedData,
          updatedAt: new Date(),
        };
        this.profiles.set(subdomain, updated);
        return {
          ...updated,
          toJSON() {
            const copy = { ...updated };
            delete copy.passwordHash;
            return copy;
          }
        };
      }
    }
    return null;
  }

  async countDocuments() {
    return this.profiles.size;
  }
}

export const memoryStore = new InMemoryProfileStore();

export default {
  Profile,
  memoryStore,
};
