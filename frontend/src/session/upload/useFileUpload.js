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
  // Returns the array of newly created file wrappers so callers can act on them immediately
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

    // Return the newly created wrappers so caller can trigger upload immediately if desired
    return newFiles;
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
  // filesToUploadWrappers: optional array of our local file wrapper objects to upload (so caller can pass newly added files)
  const uploadFilesToServer = useCallback(async (sessionToken, messageText = '', filesToUploadWrappers = null) => {
    // Check if there are files to upload (either passed explicitly or in state)
    const wrappers = filesToUploadWrappers && filesToUploadWrappers.length > 0 ? filesToUploadWrappers : uploadedFiles;
    
    if (wrappers.length === 0) {
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
      // Mark files as uploading
      // If caller passed a subset to upload, mark those as uploading, otherwise mark all
      const uploadingIds = new Set(wrappers.map(f => f.id));
      setUploadedFiles(prev => 
        prev.map(file => uploadingIds.has(file.id) ? { ...file, uploading: true, error: null } : file)
      );

      // Extract actual File objects from our file wrappers
      const filesToUpload = wrappers.map(fileWrapper => fileWrapper.file);

      // Upload to backend with session token and optional text
      const result = await uploadFiles(filesToUpload, sessionToken, messageText);

      if (result.success) {
        // Attach server metadata to the corresponding wrappers when possible
        // result.data.files is expected to be an array of uploaded file metadata (name, id, url...)
        const returnedFiles = result.data?.files || [];

        setUploadedFiles(prev => {
          // For each prev file, if it matches one of the returnedFiles by name+size, attach server metadata
          return prev.map(local => {
            const match = returnedFiles.find(r => r.name === local.name && (r.size == null || r.size === local.size));
            if (match) {
              return {
                ...local,
                uploading: false,
                uploaded: true,
                error: null,
                serverId: match.id || match.file_id || match.fileId || null,
                serverUrl: match.url || match.download_url || match.file_url || null,
                serverMeta: match
              };
            }
            // If wrapper was uploaded in this batch but server didn't return a match, still mark uploaded true
            if (wrappers.some(w => w.id === local.id)) {
              return { ...local, uploading: false, uploaded: true, error: null };
            }
            return local;
          });
        });

        return {
          success: true,
          data: result.data,
          uploadedFiles: result.data.files
        };
      } else {
        // Mark files as failed
        // Mark the impacted wrappers as failed
        const failedIds = (filesToUploadWrappers && filesToUploadWrappers.length > 0) ? new Set(filesToUploadWrappers.map(f => f.id)) : null;
        setUploadedFiles(prev => 
          prev.map(file => ({ 
            ...file, 
            uploading: false, 
            uploaded: false,
            error: failedIds ? (failedIds.has(file.id) ? result.error : file.error) : result.error 
          }))
        );

        setUploadError(result.error);
        return { success: false, error: result.error };
      }
    } catch {
      const errorMessage = 'Failed to upload files';
      
      // Mark the impacted wrappers as failed
      const failedIds = (filesToUploadWrappers && filesToUploadWrappers.length > 0) ? new Set(filesToUploadWrappers.map(f => f.id)) : null;
      setUploadedFiles(prev => 
        prev.map(file => ({ 
          ...file, 
          uploading: false, 
          uploaded: false,
          error: failedIds ? (failedIds.has(file.id) ? errorMessage : file.error) : errorMessage 
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