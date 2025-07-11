import { makeAutoObservable, runInAction } from 'mobx';
import type { UnclaimedProperty } from '../types/Property';

export interface CartItem {
  property: UnclaimedProperty;
  addedAt: Date;
}

export interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ssn: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
}

export class CartStore {
  // Observable state
  items: CartItem[] = [];
  isCheckoutOpen = false;
  checkoutStep = 1; // 1: Review Cart, 2: Enter Details, 3: Confirmation
  checkoutData: CheckoutData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ssn: '',
    address: {
      street1: '',
      street2: '',
      city: '',
      state: 'CA',
      zipCode: ''
    },
    notes: ''
  };

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  addToCart = (property: UnclaimedProperty) => {
    // Check if property is already in cart
    const existingItem = this.items.find(item => item.property.id === property.id);
    if (existingItem) {
      return; // Already in cart, don't add duplicate
    }

    runInAction(() => {
      this.items.push({
        property,
        addedAt: new Date()
      });
    });
  };

  removeFromCart = (propertyId: string) => {
    runInAction(() => {
      this.items = this.items.filter(item => item.property.id !== propertyId);
    });
  };

  clearCart = () => {
    runInAction(() => {
      this.items = [];
    });
  };

  openCheckout = () => {
    this.isCheckoutOpen = true;
    this.checkoutStep = 1;
  };

  closeCheckout = () => {
    this.isCheckoutOpen = false;
    this.checkoutStep = 1;
  };

  setCheckoutStep = (step: number) => {
    this.checkoutStep = step;
  };

  updateCheckoutData = (data: Partial<CheckoutData>) => {
    runInAction(() => {
      this.checkoutData = { ...this.checkoutData, ...data };
    });
  };

  updateCheckoutAddress = (address: Partial<CheckoutData['address']>) => {
    runInAction(() => {
      this.checkoutData.address = { ...this.checkoutData.address, ...address };
    });
  };

  // Prepopulate address from property data
  prepopulateFromProperty = (property: UnclaimedProperty) => {
    // Helper function to check if a field has meaningful content
    const hasContent = (field: string | undefined | null): boolean => {
      return field != null && field.trim().length > 0;
    };

    // We need at least city OR street1 to proceed with prepopulation
    const hasCity = hasContent(property.ownerCity);
    const hasStreet = hasContent(property.ownerStreet1);
    
    if (hasCity || hasStreet) {
      runInAction(() => {
        this.checkoutData.address = {
          // ownerStreet1 now contains the full address from the database response
          street1: hasContent(property.ownerStreet1) ? property.ownerStreet1!.trim() : '',
          street2: hasContent(property.ownerStreet2) ? property.ownerStreet2!.trim() : '',
          city: hasContent(property.ownerCity) ? property.ownerCity!.trim() : '',
          state: hasContent(property.ownerState) ? property.ownerState!.trim() : 'CA',
          zipCode: hasContent(property.ownerZip) ? property.ownerZip!.trim() : ''
        };
      });
    }
  };

  resetCheckoutData = () => {
    runInAction(() => {
      this.checkoutData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        ssn: '',
        address: {
          street1: '',
          street2: '',
          city: '',
          state: 'CA',
          zipCode: ''
        },
        notes: ''
      };
    });
  };

  // Computed values
  get itemCount() {
    return this.items.length;
  }

  get totalAmount() {
    return this.items.reduce((total, item) => total + item.property.currentCashBalance, 0);
  }

  get hasItems() {
    return this.items.length > 0;
  }

  get isPropertyInCart() {
    return (propertyId: string) => {
      return this.items.some(item => item.property.id === propertyId);
    };
  }

  get canProceedToNextStep() {
    switch (this.checkoutStep) {
      case 1:
        return this.hasItems;
      case 2:
        return this.checkoutData.firstName.trim() !== '' &&
               this.checkoutData.lastName.trim() !== '' &&
               this.checkoutData.email.trim() !== '' &&
               this.checkoutData.address.street1.trim() !== '' &&
               this.checkoutData.address.city.trim() !== '' &&
               this.checkoutData.address.state.trim() !== '' &&
               this.checkoutData.address.zipCode.trim() !== '';
      case 3:
        return true;
      default:
        return false;
    }
  }

  get sortedItems() {
    return [...this.items].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }
} 