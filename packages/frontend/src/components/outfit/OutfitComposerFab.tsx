import { motion, AnimatePresence } from 'framer-motion';
import { useOutfitComposerStore } from '../../stores/outfitComposer';

export function OutfitComposerFab() {
  const isOpen = useOutfitComposerStore((state) => state.isOpen);
  const selectedCount = useOutfitComposerStore((state) => state.selectedProducts.length);
  const openComposer = useOutfitComposerStore((state) => state.openComposer);

  // Don't show FAB when composer is open
  if (isOpen) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openComposer}
      className="fixed bottom-6 right-6 z-40 bg-forest-600 hover:bg-forest-700 text-white rounded-full shadow-lg p-4 flex items-center gap-3 transition-colors group"
      aria-label="Open outfit composer"
    >
      {/* Icon */}
      <svg
        className="w-6 h-6"
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

      {/* Badge with count */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-burnt-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
          >
            {selectedCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip on hover */}
      <span className="hidden group-hover:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap">
        Outfit Composer
      </span>
    </motion.button>
  );
}

