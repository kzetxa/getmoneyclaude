import React, { createContext, useContext } from 'react';
import { RootStore, rootStore } from './RootStore';

const StoreContext = createContext<RootStore>(rootStore);

interface StoreProviderProps {
  children: React.ReactNode;
  store?: RootStore;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  store = rootStore 
}) => {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
};

export const usePropertyStore = () => {
  const { propertyStore } = useStore();
  return propertyStore;
};

export const useCartStore = () => {
  const { cartStore } = useStore();
  return cartStore;
}; 