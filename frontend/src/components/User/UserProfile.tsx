import { useState, useRef } from 'react';
import { FaUser, FaEnvelope, FaSave, FaCamera, FaCog } from 'react-icons/fa';
import { useAuth } from '@lib/auth/AuthProvider';
import { apiClient } from '@lib/api/client';

interface UserProfileData {
  displayName: string;
  email: string;
  bio: string;
  avatarUrl: string;
  location?: string;
  website?: string;
  occupation?: string;
}

interface UserProfileProps {
  onUpdate?: (data: UserProfileData) => void;
  showSettings?: boolean;
}

export function UserProfile({ onUpdate, showSettings = true }: UserProfileProps) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UserProfileData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    location: user?.location || '',
    website: user?.website || '',
    occupation: user?.occupation || '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put('/users/profile', formData);
      updateUser(response.data.user);
      onUpdate?.(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData((prev) => ({ ...prev, avatarUrl: response.data.avatarUrl }));
      updateUser({ ...user, avatarUrl: response.data.avatarUrl });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      location: user?.location || '',
      website: user?.website || '',
      occupation: user?.occupation || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaUser className="w-6 h-6" />
            Profile
          </h2>
          {showSettings && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <FaCog className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--accent-primary)] bg-[var(--bg-tertiary)]">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]">
                  <FaUser className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Upload overlay */}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="text-center text-white">
                  {uploadingAvatar ? (
                    <div className="spinner w-8 h-8 mx-auto"></div>
                  ) : (
                    <>
                      <FaCamera className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-sm">Change</span>
                    </>
                  )}
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-4">
            {formData.displayName || 'Unnamed Explorer'}
          </h3>
          {formData.occupation && (
            <p className="text-[var(--text-secondary)] mt-1">{formData.occupation}</p>
          )}
        </div>

        {/* Profile Fields */}
        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Display Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Your display name"
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            ) : (
              <p className="text-[var(--text-primary)] px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg">
                {formData.displayName || 'Not set'}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
              <FaEnvelope className="w-4 h-4" />
              Email
            </label>
            <p className="text-[var(--text-primary)] px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg opacity-60">
              {formData.email}
              <span className="block text-xs text-[var(--text-tertiary)] mt-1">
                Email cannot be changed here
              </span>
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none"
              />
            ) : (
              <p className="text-[var(--text-primary)] px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg min-h-[100px]">
                {formData.bio || 'No bio yet'}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            ) : (
              <p className="text-[var(--text-primary)] px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg">
                {formData.location || 'Not set'}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Website
            </label>
            {isEditing ? (
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            ) : (
              <p className="text-[var(--text-primary)] px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg">
                {formData.website ? (
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-primary)] hover:underline"
                  >
                    {formData.website}
                  </a>
                ) : (
                  'Not set'
                )}
              </p>
            )}
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Occupation
            </label>
            {isEditing ? (
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                placeholder="Student, Developer, Researcher, etc."
                className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            ) : (
              <p className="text-[var(--text-primary)] px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg">
                {formData.occupation || 'Not set'}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:opacity-80 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
