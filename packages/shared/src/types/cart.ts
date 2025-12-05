export interface CartItem {
  productId: number;
  name: string;
  priceInCents: number;
  size: string;
  color: string;
  quantity: number;
  imageUrl: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPriceInCents: number;
}
