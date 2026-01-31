import { useState } from 'react'
import type { Album } from '../types/vinyl'
import SpotifyAlbumImport from './SpotifyAlbumImport'
import ManualAlbumForm from './ManualAlbumForm'
import ModeChoice from './ModeChoice'

interface CreateAlbumFormProps {
  onAlbumCreated: (album: Album) => void;
  onCancel: () => void;
  userId: string;
}

type FormMode = 'choice' | 'spotify' | 'manual';

export default function CreateAlbumForm({ onAlbumCreated, onCancel, userId }: CreateAlbumFormProps) {
  const [mode, setMode] = useState<FormMode>('choice')

  return (
    <div className="w-full">
      {mode === 'choice' && (
        <ModeChoice
          onSelectSpotify={() => setMode('spotify')}
          onSelectManual={() => setMode('manual')}
          onCancel={onCancel}
        />
      )}

      {mode === 'spotify' && (
        <SpotifyAlbumImport
          onAlbumCreated={onAlbumCreated}
          onBack={() => setMode('choice')}
          userId={userId}
        />
      )}

      {mode === 'manual' && (
        <ManualAlbumForm
          onAlbumCreated={onAlbumCreated}
          onBack={() => setMode('choice')}
          userId={userId}
        />
      )}
    </div>
  )
}