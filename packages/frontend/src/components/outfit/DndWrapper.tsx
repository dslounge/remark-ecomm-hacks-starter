import { ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Product } from '@summit-gear/shared';
import { useOutfitComposerStore } from '../../stores/outfitComposer';

interface DndWrapperProps {
  children: ReactNode;
}

interface DragData {
  type: 'product';
  product: Product;
}

export function DndWrapper({ children }: DndWrapperProps) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const addProduct = useOutfitComposerStore((state) => state.addProduct);
  const openComposer = useOutfitComposerStore((state) => state.openComposer);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data?.type === 'product') {
      setActiveProduct(data.product);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'outfit-composer-drop-zone') {
      const data = active.data.current as DragData | undefined;
      if (data?.type === 'product') {
        addProduct(data.product);
        openComposer();
      }
    }
    
    setActiveProduct(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      <DragOverlay dropAnimation={null}>
        {activeProduct ? (
          <div className="w-48 bg-white rounded-lg shadow-2xl border-2 border-forest-500 p-3 cursor-grabbing opacity-90">
            <img
              src={activeProduct.imageUrl}
              alt={activeProduct.name}
              className="w-full aspect-square object-cover rounded mb-2"
            />
            <p className="text-sm font-medium text-gray-900 truncate">
              {activeProduct.name}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

