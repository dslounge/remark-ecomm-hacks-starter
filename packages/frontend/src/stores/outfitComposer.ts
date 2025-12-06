import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@summit-gear/shared';

export interface SelectedProduct {
  product: Product;
  addedAt: number;
}

export interface ImageUpload {
  file: File;
  preview: string;
}

interface OutfitComposerStore {
  // UI State
  isOpen: boolean;
  isMinimized: boolean;
  
  // Product selection (independent of cart)
  selectedProducts: SelectedProduct[];
  
  // Image uploads
  faceImage: ImageUpload | null;
  bodyImage: ImageUpload | null;
  
  // Generation state
  isGenerating: boolean;
  error: string | null;
  generatedImageUrl: string | null;
  
  // Actions
  openComposer: () => void;
  closeComposer: () => void;
  toggleMinimized: () => void;
  
  addProduct: (product: Product) => void;
  removeProduct: (productId: number) => void;
  clearProducts: () => void;
  hasProduct: (productId: number) => boolean;
  
  setFaceImage: (upload: ImageUpload | null) => void;
  setBodyImage: (upload: ImageUpload | null) => void;
  
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setGeneratedImage: (url: string | null) => void;
  
  reset: () => void;
}

export const useOutfitComposerStore = create<OutfitComposerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isMinimized: false,
      selectedProducts: [],
      faceImage: null,
      bodyImage: null,
      isGenerating: false,
      error: null,
      generatedImageUrl: null,
      
      // UI Actions
      openComposer: () => set({ isOpen: true, isMinimized: false }),
      closeComposer: () => set({ isOpen: false }),
      toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
      
      // Product Actions
      addProduct: (product) => {
        const { selectedProducts, hasProduct } = get();
        
        // Don't add duplicates
        if (hasProduct(product.id)) {
          return;
        }
        
        set({
          selectedProducts: [
            ...selectedProducts,
            { product, addedAt: Date.now() },
          ],
        });
      },
      
      removeProduct: (productId) => {
        set({
          selectedProducts: get().selectedProducts.filter(
            (sp) => sp.product.id !== productId
          ),
        });
      },
      
      clearProducts: () => set({ selectedProducts: [] }),
      
      hasProduct: (productId) => {
        return get().selectedProducts.some((sp) => sp.product.id === productId);
      },
      
      // Image Actions
      setFaceImage: (upload) => set({ faceImage: upload }),
      setBodyImage: (upload) => set({ bodyImage: upload }),
      
      // Generation Actions
      setGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error }),
      setGeneratedImage: (url) => set({ generatedImageUrl: url }),
      
      // Reset
      reset: () => set({
        selectedProducts: [],
        faceImage: null,
        bodyImage: null,
        isGenerating: false,
        error: null,
        generatedImageUrl: null,
      }),
    }),
    {
      name: 'outfit-composer',
      // Don't persist File objects or previews (they're not serializable)
      partialize: (state) => ({
        isOpen: state.isOpen,
        isMinimized: state.isMinimized,
        // Don't persist selectedProducts, images, or generation state
      }),
    }
  )
);
