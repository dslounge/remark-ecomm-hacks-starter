import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { OutfitComposerFab } from '../outfit/OutfitComposerFab';
import { OutfitComposerPopover } from '../outfit/OutfitComposerPopover';

export interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      
      {/* Global Outfit Composer UI */}
      <OutfitComposerFab />
      <OutfitComposerPopover />
    </div>
  );
}
