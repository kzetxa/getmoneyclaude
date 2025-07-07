import { PropertyStore } from './PropertyStore';
import { CartStore } from './CartStore';

export class RootStore {
  propertyStore: PropertyStore;
  cartStore: CartStore;

  constructor() {
    this.propertyStore = new PropertyStore();
    this.cartStore = new CartStore();
  }
}

export const rootStore = new RootStore(); 