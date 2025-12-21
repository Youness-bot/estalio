import { supabase } from '../lib/supabase';

/**
 * Storage service for handling file uploads to Supabase Storage
 */
class StorageService {
  /**
   * Upload a file to property-images bucket
   * @param {File} file - The file to upload
   * @param {string} userId - The user's ID for folder organization
   * @param {string} propertyId - Optional property ID for better organization
   * @returns {Promise<{path: string, url: string}>} - The file path and public URL
   */
  async uploadPropertyImage(file, userId, propertyId = null) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file?.name?.split('.')?.pop();
      const fileName = `${timestamp}-${Math.random()?.toString(36)?.substring(7)}.${fileExt}`;
      
      // Organize by user and optionally by property
      const folderPath = propertyId 
        ? `${userId}/properties/${propertyId}`
        : `${userId}/temp`;
      
      const filePath = `${folderPath}/${fileName}`;

      // Upload file
      const { data, error } = await supabase?.storage?.from('property-images')?.upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase?.storage?.from('property-images')?.getPublicUrl(filePath);

      return {
        path: data?.path,
        url: publicUrl
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   * @param {FileList|Array<File>} files - The files to upload
   * @param {string} userId - The user's ID
   * @param {string} propertyId - Optional property ID
   * @returns {Promise<Array<{path: string, url: string}>>} - Array of file paths and URLs
   */
  async uploadMultiplePropertyImages(files, userId, propertyId = null) {
    try {
      const uploadPromises = Array.from(files)?.map(file => 
        this.uploadPropertyImage(file, userId, propertyId)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete a file from property-images bucket
   * @param {string} filePath - The file path to delete
   * @returns {Promise<void>}
   */
  async deletePropertyImage(filePath) {
    try {
      const { error } = await supabase?.storage?.from('property-images')?.remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   * @param {Array<string>} filePaths - Array of file paths to delete
   * @returns {Promise<void>}
   */
  async deleteMultiplePropertyImages(filePaths) {
    try {
      const { error } = await supabase?.storage?.from('property-images')?.remove(filePaths);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw error;
    }
  }

  /**
   * List files in a user's folder
   * @param {string} userId - The user's ID
   * @param {string} propertyId - Optional property ID
   * @returns {Promise<Array>} - Array of file objects
   */
  async listPropertyImages(userId, propertyId = null) {
    try {
      const folderPath = propertyId 
        ? `${userId}/properties/${propertyId}`
        : `${userId}`;

      const { data, error } = await supabase?.storage?.from('property-images')?.list(folderPath, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param {string} filePath - The file path
   * @returns {string} - The public URL
   */
  getPublicUrl(filePath) {
    const { data: { publicUrl } } = supabase?.storage?.from('property-images')?.getPublicUrl(filePath);
    
    return publicUrl;
  }

  /**
   * Validate file before upload
   * @param {File} file - The file to validate
   * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
   * @returns {Object} - Validation result {isValid, error}
   */
  validateFile(file, maxSizeMB = 10) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes?.includes(file?.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes?.join(', ')}`
      };
    }

    if (file?.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`
      };
    }

    return { isValid: true, error: null };
  }
}

export default new StorageService();