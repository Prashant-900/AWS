import { useState, useCallback } from 'react';
import { validateFile } from './uploadUtils';
import { uploadFiles } from '../../api/uploads';

/**
 * Hook for managing file upload functionality
 */
const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add files to upload list
  const addFiles = useCallback((files) => {
    const newFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        const fileWithId = {
          id: generateFileId(),
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: null,
          uploading: false,
          uploaded: false,
          error: null
        };

        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === fileWithId.id 
                  ? { ...f, preview: e.target.result }
                  : f
              )
            );
          };
          reader.readAsDataURL(file);
        }

        newFiles.push(fileWithId);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    } else {
      setUploadError('');
    }

    setIsUploadPopupOpen(false);
  }, [generateFileId]);

  // Remove file from upload list
  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    setUploadError('');
  }, []);

  // Toggle upload popup
  const toggleUploadPopup = useCallback(() => {
    setIsUploadPopupOpen(prev => !prev);
    setUploadError(''); // Clear error when opening popup
  }, []);

  // Close upload popup
  const closeUploadPopup = useCallback(() => {
    setIsUploadPopupOpen(false);
    setUploadError('');
  }, []);

  // Upload files to backend with optional text message
  const uploadFilesToServer = useCallback(async (sessionToken, messageText = '') => {
    if (uploadedFiles.length === 0) {
      setUploadError('No files to upload');
      return { success: false, error: 'No files to upload' };
    }

    if (!sessionToken) {
      setUploadError('Session token is required for file upload');
      return { success: false, error: 'Session token is required' };
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Mark all files as uploading
      setUploadedFiles(prev => 
        prev.map(file => ({ ...file, uploading: true, error: null }))
      );

      // Extract actual File objects from our file wrappers
      const filesToUpload = uploadedFiles.map(fileWrapper => fileWrapper.file);

      // Upload to backend with session token and optional text
      const result = await uploadFiles(filesToUpload, sessionToken, messageText);

      if (result.success) {
        // Mark files as uploaded
        setUploadedFiles(prev => 
          prev.map(file => ({ 
            ...file, 
            uploading: false, 
            uploaded: true,
            error: null 
          }))
        );

        return { 
          success: true, 
          data: result.data,
          uploadedFiles: result.data.files 
        };
      } else {
        // Mark files as failed
        setUploadedFiles(prev => 
          prev.map(file => ({ 
            ...file, 
            uploading: false, 
            uploaded: false,
            error: result.error 
          }))
        );

        setUploadError(result.error);
        return { success: false, error: result.error };
      }
    } catch {
      const errorMessage = 'Failed to upload files';
      
      // Mark files as failed
      setUploadedFiles(prev => 
        prev.map(file => ({ 
          ...file, 
          uploading: false, 
          uploaded: false,
          error: errorMessage 
        }))
      );

      setUploadError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles]);

  return {
    uploadedFiles,
    isUploadPopupOpen,
    uploadError,
    isUploading,
    addFiles,
    removeFile,
    clearAllFiles,
    toggleUploadPopup,
    closeUploadPopup,
    setUploadError,
    uploadFilesToServer
  };
};

export default useFileUpload;