import { InspectionData } from '@/types';

const API_BASE = '/api/inspections';

export class ApiService {
  // Fetch all inspection data
  static async getInspections(): Promise<InspectionData[]> {
    try {
      const response = await fetch(API_BASE);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching inspections:', error);
      throw error;
    }
  }

  // Update all inspection data
  static async updateAllInspections(data: InspectionData[]): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update data');
      }
    } catch (error) {
      console.error('Error updating inspections:', error);
      throw error;
    }
  }

  // Update specific month data
  static async updateMonthData(monthId: string, data: InspectionData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${monthId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update month data');
      }
    } catch (error) {
      console.error('Error updating month data:', error);
      throw error;
    }
  }

  // Update specific stage data
  static async updateStageData(
    monthId: string, 
    stageId: string, 
    inspected?: number, 
    faults?: number
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${monthId}/stages/${stageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inspected, faults }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update stage data');
      }
    } catch (error) {
      console.error('Error updating stage data:', error);
      throw error;
    }
  }

  // Create new inspection data
  static async createInspection(data: InspectionData): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create data');
      }
    } catch (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
  }

  // Delete inspection data
  static async deleteInspection(monthId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${monthId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete data');
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
      throw error;
    }
  }
}

