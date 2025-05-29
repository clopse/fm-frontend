// FILE: src/components/hotels/SaveIndicator.tsx
'use client';

import { AlertTriangle, CheckCircle, RefreshCw, Save } from 'lucide-react';

interface SaveIndicatorProps {
  isEditing: boolean;
  isSaving: boolean;
  saveMessage: string;
  onSave: () => void;
}

export default function SaveIndicator({ 
  isEditing, 
  isSaving, 
  saveMessage, 
  onSave 
}: SaveIndicatorProps) {
  return (
    <div className="flex items-center space-x-3">
      {saveMessage && (
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {saveMessage.includes('Error') ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{saveMessage}</span>
        </div>
      )}
      {isEditing && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      )}
    </div>
  );
}
