'use client';

import { useRef, useState, useEffect } from 'react';
import { CanvasObject } from '@/types/canvas';

interface ImageObjectProps {
  object: CanvasObject;
  isSelected: boolean;
  onUpdate: (partial: Partial<CanvasObject>) => void;
}

export default function ImageObject({ object, isSelected, onUpdate }: ImageObjectProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const imageUrl = object.metadata?.imageUrl;
  const imageAlt = object.metadata?.imageAlt || 'Image';

  // Clipboard paste handler
  useEffect(() => {
    if (!isSelected) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => {
            onUpdate({
              metadata: {
                ...object.metadata,
                imageUrl: reader.result as string,
                isGif: item.type === 'image/gif',
              },
            });
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isSelected, object.metadata, onUpdate]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({
        metadata: {
          ...object.metadata,
          imageUrl: reader.result as string,
          isGif: file.type === 'image/gif',
        },
      });
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleConfirmUrl() {
    if (!urlValue.trim()) return;
    onUpdate({
      metadata: {
        ...object.metadata,
        imageUrl: urlValue.trim(),
        isGif: urlValue.trim().toLowerCase().endsWith('.gif'),
      },
    });
    setShowUrlInput(false);
    setUrlValue('');
  }

  function handleClearImage() {
    onUpdate({
      metadata: {
        ...object.metadata,
        imageUrl: undefined,
        isGif: false,
      },
    });
  }

  // Loaded state
  if (imageUrl) {
    return (
      <div
        className="relative w-full h-full overflow-hidden rounded"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false}
        />
        {isSelected && (
          <button
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white rounded-full text-xs leading-none hover:bg-black/80 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClearImage}
            title="Remove image"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  // Placeholder state
  return (
    <div
      className="bg-gray-50 w-full h-full flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-gray-300 cursor-pointer text-gray-400"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.gif"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Icon + label */}
      <div className="flex flex-col items-center gap-1 select-none">
        <span className="text-3xl">🖼️</span>
        <span className="text-xs font-medium text-gray-400">Add Image</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-2">
        <button
          className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </button>

        {!showUrlInput ? (
          <button
            className="border border-gray-300 text-xs px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowUrlInput(true)}
          >
            Paste URL
          </button>
        ) : (
          <div
            className="flex gap-2 items-center"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="https://..."
              value={urlValue}
              autoFocus
              className="border rounded px-2 py-1 text-xs w-40 outline-none focus:border-indigo-400"
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmUrl();
                if (e.key === 'Escape') {
                  setShowUrlInput(false);
                  setUrlValue('');
                }
              }}
            />
            <button
              className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
              onClick={handleConfirmUrl}
            >
              Add
            </button>
          </div>
        )}

        <span className="text-[10px] text-gray-300 select-none">or press Ctrl+V to paste</span>
      </div>
    </div>
  );
}
