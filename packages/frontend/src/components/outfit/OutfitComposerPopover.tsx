import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import { useOutfitComposerStore } from '../../stores/outfitComposer';
import { generateOutfit } from '../../api/outfits';
import { ApiClientError } from '../../api/client';
import {
  validateImageFile,
  fileToBase64,
  getMimeType,
  createImagePreview,
} from '../../lib/outfitUpload';
import { formatPrice } from '../../lib/utils';
import { Button } from '../ui/Button';

export function OutfitComposerPopover() {
  const {
    isOpen,
    isMinimized,
    selectedProducts,
    faceImage,
    bodyImage,
    isGenerating,
    error,
    generatedImageUrl,
    closeComposer,
    toggleMinimized,
    removeProduct,
    clearProducts,
    setFaceImage,
    setBodyImage,
    setGenerating,
    setError,
    setGeneratedImage,
  } = useOutfitComposerStore();

  const { setNodeRef, isOver } = useDroppable({
    id: 'outfit-composer-drop-zone',
  });

  const handleImageUpload = useCallback(
    async (files: File[], type: 'face' | 'body') => {
      const file = files[0];
      if (!file) return;

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setError(null);
      const preview = await createImagePreview(file);
      const setter = type === 'face' ? setFaceImage : setBodyImage;
      setter({ file, preview });
    },
    [setError, setFaceImage, setBodyImage]
  );

  const faceDropzone = useDropzone({
    onDrop: (files) => handleImageUpload(files, 'face'),
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    multiple: false,
  });

  const bodyDropzone = useDropzone({
    onDrop: (files) => handleImageUpload(files, 'body'),
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!faceImage || !bodyImage) {
      setError('Upload both a face photo and a full-body photo.');
      return;
    }
    if (selectedProducts.length === 0) {
      setError('Add at least one product to generate an outfit.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const [faceImageBase64, bodyImageBase64] = await Promise.all([
        fileToBase64(faceImage.file),
        fileToBase64(bodyImage.file),
      ]);

      const response = await generateOutfit({
        productIds: selectedProducts.map((sp) => sp.product.id),
        faceImageBase64,
        faceImageMimeType: getMimeType(faceImage.file),
        bodyImageBase64,
        bodyImageMimeType: getMimeType(bodyImage.file),
      });

      const { generatedImageBase64, generatedImageMimeType } = response.data;
      const dataUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`;
      setGeneratedImage(dataUrl);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.response.message);
      } else {
        setError('Failed to generate outfit. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{ maxHeight: isMinimized ? '60px' : '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-forest-50">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-forest-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Outfit Composer</h2>
            {selectedProducts.length > 0 && (
              <span className="px-2 py-0.5 bg-forest-100 text-forest-700 text-xs font-medium rounded-full">
                {selectedProducts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMinimized}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMinimized ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={closeComposer}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content (hidden when minimized) */}
        {!isMinimized && (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
            <div className="p-4 space-y-4">
              {/* Drop Zone */}
              <div
                ref={setNodeRef}
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                  isOver
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <svg
                    className={`mx-auto h-12 w-12 ${
                      isOver ? 'text-forest-500' : 'text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Drag products here or click "Add to Outfit" on any product
                  </p>
                </div>
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Selected Products ({selectedProducts.length})
                    </h3>
                    <button
                      onClick={clearProducts}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedProducts.map(({ product }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(product.priceInCents)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          aria-label="Remove product"
                        >
                          <svg
                            className="w-4 h-4 text-gray-400 hover:text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Uploads */}
              <div className="grid grid-cols-2 gap-3">
                {/* Face Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Face Photo
                  </label>
                  <div
                    {...faceDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors ${
                      faceDropzone.isDragActive
                        ? 'border-forest-500 bg-forest-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...faceDropzone.getInputProps()} />
                    {faceImage ? (
                      <div className="relative">
                        <img
                          src={faceImage.preview}
                          alt="Face preview"
                          className="w-full aspect-square object-cover rounded"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFaceImage(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="mx-auto h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <p className="text-xs text-gray-500 mt-1">Upload</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Photo
                  </label>
                  <div
                    {...bodyDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors ${
                      bodyDropzone.isDragActive
                        ? 'border-forest-500 bg-forest-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...bodyDropzone.getInputProps()} />
                    {bodyImage ? (
                      <div className="relative">
                        <img
                          src={bodyImage.preview}
                          alt="Body preview"
                          className="w-full aspect-square object-cover rounded"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBodyImage(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="mx-auto h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <p className="text-xs text-gray-500 mt-1">Upload</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating outfit...' : 'Generate Outfit'}
              </Button>

              {/* Generated Image */}
              {generatedImageUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Generated Outfit</h3>
                  <img
                    src={generatedImageUrl}
                    alt="Generated outfit"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

