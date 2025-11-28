'use client';

import { useState, useRef } from 'react';
import { User, Upload, Loader2, CheckCircle, X } from 'lucide-react';
import Image from 'next/image';

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    phone: string | null;
    profilePhoto: string | null;
    governmentId: string;
    totalAllowedHours: number;
    usedHours: number;
    role: string;
  };
  onUpdateSuccess?: () => void;
}

export default function ProfileForm({ initialData, onUpdateSuccess }: ProfileFormProps) {
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(initialData.profilePhoto);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingHours = initialData.totalAllowedHours - initialData.usedHours;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image trop volumineuse (max 2 MB)');
        return;
      }

      setPhotoFile(file);
      setError(null);
      setHasChanges(true);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoFile(null);
    setHasChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(value !== initialData.name || phone !== (initialData.phone || ''));
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setHasChanges(name !== initialData.name || value !== (initialData.phone || ''));
  };

  const handleCancel = () => {
    setName(initialData.name);
    setPhone(initialData.phone || '');
    setProfilePhoto(initialData.profilePhoto);
    setPhotoFile(null);
    setHasChanges(false);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (!profilePhoto && initialData.profilePhoto) {
        formData.append('removePhoto', 'true');
      }

      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Échec de la mise à jour du profil');
      }

      setSuccess(true);
      setHasChanges(false);

      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Photo de profil
        </label>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePhoto ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={profilePhoto}
                  alt="Photo de profil"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Upload className="h-4 w-4" />
              {profilePhoto ? 'Changer' : 'Télécharger'}
            </button>
            {profilePhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors text-sm font-medium"
                disabled={isSubmitting}
              >
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF (max 2 MB)</p>
      </div>

      {/* Name - Editable */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nom complet *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Phone - Editable */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="+33 6 12 34 56 78"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Email - Read-only */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={initialData.email}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
          disabled
        />
        <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
      </div>

  

  

      {/* Hours Information - Read-only */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">Informations sur les heures</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-700 mb-1">Total autorisé</p>
            <p className="text-2xl font-bold text-blue-900">{initialData.totalAllowedHours}h</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 mb-1">Heures utilisées</p>
            <p className="text-2xl font-bold text-blue-900">{initialData.usedHours}h</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 mb-1">Heures restantes</p>
            <p className="text-2xl font-bold text-blue-900">{remainingHours}h</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Profil mis à jour avec succès!</p>
            <p className="text-sm text-green-700 mt-1">Vos modifications ont été enregistrées.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={!hasChanges || isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!hasChanges || isSubmitting}
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
