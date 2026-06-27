import React, { createContext, useContext } from 'react';
import { IStorageService } from './IStorageService';
import { AppwriteProvider } from './providers/AppwriteProvider';

// Appwrite database provider is active by default with local AsyncStorage fallback
const activeProvider: IStorageService = new AppwriteProvider();

const StorageContext = createContext<IStorageService>(activeProvider);

interface StorageProviderProps {
  children: React.ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  return (
    <StorageContext.Provider value={activeProvider}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): IStorageService {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
