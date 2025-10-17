'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InspectionData, InspectionStage, generateYearData } from '@/types';
import { 
  updateInspectionData, 
  addStageToAllMonths, 
  removeStageFromAllMonths,
  generateStageId,
  validateStageName,
  getAllStageNames
} from '@/utils/dataUtils';
import { ApiService } from '@/services/apiService';

interface DataContextType {
  data: InspectionData[];
  loading: boolean;
  error: string | null;
  updateData: (monthId: string, stageId: string, inspected?: number, faults?: number) => Promise<void>;
  addStage: (stageName: string) => Promise<boolean>;
  removeStage: (stageId: string) => Promise<void>;
  getStageNames: () => string[];
  createNewYear: (year: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  saveAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
  initialData: InspectionData[];
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, initialData }) => {
  const [data, setData] = useState<InspectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from MongoDB on mount
  useEffect(() => {
    loadDataFromMongoDB();
  }, []);

  const loadDataFromMongoDB = async () => {
    setLoading(true);
    setError(null);
    
    // Corporate firewall-friendly: Try localStorage first, then MongoDB as fallback
    const savedData = localStorage.getItem('inspection-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.length > 0) {
          setData(parsedData);
          console.log('Loaded data from localStorage (corporate-friendly mode)');
          setLoading(false);
          
          // Try to sync with MongoDB in background (non-blocking)
          try {
            const mongoData = await ApiService.getInspections();
            if (mongoData.length > 0) {
              const sortedData = mongoData.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return monthOrder.indexOf(a.date.substring(0, 3)) - monthOrder.indexOf(b.date.substring(0, 3));
              });
              setData(sortedData);
              localStorage.setItem('inspection-data', JSON.stringify(sortedData));
              console.log('Synced with MongoDB successfully');
            }
          } catch (mongoError) {
            console.log('MongoDB sync failed (expected in corporate environments)');
          }
          return;
        }
      } catch (parseError) {
        console.error('Failed to parse saved data:', parseError);
      }
    }
    
    // If no localStorage data, try MongoDB
    try {
      const mongoData = await ApiService.getInspections();
      if (mongoData.length > 0) {
        const sortedData = mongoData.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthOrder.indexOf(a.date.substring(0, 3)) - monthOrder.indexOf(b.date.substring(0, 3));
        });
        setData(sortedData);
        localStorage.setItem('inspection-data', JSON.stringify(sortedData));
      } else {
        // If no data in MongoDB, use initial data
        setData(initialData);
        localStorage.setItem('inspection-data', JSON.stringify(initialData));
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data from MongoDB:', error);
      setError('Using offline mode - MongoDB not available');
      
      // Use initial data as fallback
      setData(initialData);
      localStorage.setItem('inspection-data', JSON.stringify(initialData));
      setLoading(false);
    }
  };

  const updateData = async (monthId: string, stageId: string, inspected?: number, faults?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update local state first
      const updatedData = data.map(month => 
        month.id === monthId 
          ? updateInspectionData(month, stageId, inspected, faults)
          : month
      );
      setData(updatedData);
      
      // Save to localStorage as backup
      localStorage.setItem('inspection-data', JSON.stringify(updatedData));
      
      // Try to update in MongoDB (but don't fail if it doesn't work)
      try {
        await ApiService.updateStageData(monthId, stageId, inspected, faults);
      } catch (mongoError) {
        console.warn('MongoDB update failed, using localStorage:', mongoError);
        setError('Using offline mode - changes saved locally');
      }
    } catch (error) {
      console.error('Failed to update data:', error);
      setError('Failed to update data');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addStage = async (stageName: string): Promise<boolean> => {
    if (!validateStageName(stageName)) {
      return false;
    }
    
    const stageId = generateStageId(stageName);
    const existingNames = getAllStageNames(data);
    
    if (existingNames.includes(stageName.trim().toUpperCase())) {
      return false; // Stage already exists
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedData = addStageToAllMonths(data, stageName.trim().toUpperCase(), stageId);
      
      // Update in MongoDB
      await ApiService.updateAllInspections(updatedData);
      
      // Update local state
      setData(updatedData);
      
      return true;
    } catch (error) {
      console.error('Failed to add stage:', error);
      setError('Failed to add stage to database');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeStage = async (stageId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedData = removeStageFromAllMonths(data, stageId);
      
      // Update in MongoDB
      await ApiService.updateAllInspections(updatedData);
      
      // Update local state
      setData(updatedData);
    } catch (error) {
      console.error('Failed to remove stage:', error);
      setError('Failed to remove stage from database');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStageNames = (): string[] => {
    return getAllStageNames(data);
  };

  const refreshData = async () => {
    await loadDataFromMongoDB();
  };

  const saveAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await ApiService.updateAllInspections(data);
    } catch (error) {
      console.error('Failed to save all data:', error);
      setError('Failed to save data to database');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createNewYear = async (year: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if data for this year already exists
      const yearExists = data.some(month => month.year === year);
      if (yearExists) {
        setError(`Data for year ${year} already exists.`);
        return false;
      }

      const newYearData = generateYearData(year);
      const updatedData = [...data, ...newYearData];

      // Sort data by year and then by month
      const sortedData = updatedData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthOrder.indexOf(a.date.substring(0, 3)) - monthOrder.indexOf(b.date.substring(0, 3));
      });

      setData(sortedData);
      localStorage.setItem('inspection-data', JSON.stringify(sortedData));

      try {
        // Add all months for the new year to MongoDB
        await ApiService.updateAllInspections(sortedData);
      } catch (mongoError) {
        console.warn('MongoDB create new year failed, using localStorage:', mongoError);
        setError('Using offline mode - new year saved locally');
      }
      return true;
    } catch (error) {
      console.error('Failed to create new year:', error);
      setError('Failed to create new year. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value: DataContextType = {
    data,
    loading,
    error,
    updateData,
    addStage,
    removeStage,
    getStageNames,
    createNewYear,
    refreshData,
    saveAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
