/**
 * File upload utilities and configurations
 */

// Supported file types
export const uploadFileTypes = {
  images: {
    accept: 'image/*',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Images (JPG, PNG, GIF, etc.)'
  },
  documents: {
    accept: '.pdf,.doc,.docx,.txt,.rtf,.odt',
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
    maxSize: 25 * 1024 * 1024, // 25MB
    description: 'Documents (PDF, Word, Text, etc.)'
  },
  spreadsheets: {
    accept: '.xls,.xlsx,.csv,.ods',
    extensions: ['.xls', '.xlsx', '.csv', '.ods'],
    maxSize: 15 * 1024 * 1024, // 15MB
    description: 'Spreadsheets (Excel, CSV, etc.)'
  },
  presentations: {
    accept: '.ppt,.pptx,.odp',
    extensions: ['.ppt', '.pptx', '.odp'],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Presentations (PowerPoint, etc.)'
  }
};

// Combined accept string for all supported file types
export const getAllAcceptedTypes = () => {
  return Object.values(uploadFileTypes)
    .map(type => type.accept)
    .join(',');
};

// File validation function
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file size (max 50MB total)
  const maxFileSize = 50 * 1024 * 1024;
  if (file.size > maxFileSize) {
    return { 
      isValid: false, 
      error: `File size too large. Maximum size is ${formatFileSize(maxFileSize)}` 
    };
  }

  // Check if file type is supported
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  
  const isSupportedType = Object.values(uploadFileTypes).some(type =>
    type.extensions.includes(fileExtension)
  );

  if (!isSupportedType) {
    return {
      isValid: false,
      error: 'File type not supported'
    };
  }

  // Additional file type specific validation
  for (const [, typeConfig] of Object.entries(uploadFileTypes)) {
    if (typeConfig.extensions.includes(fileExtension)) {
      if (file.size > typeConfig.maxSize) {
        return {
          isValid: false,
          error: `${typeConfig.description} files must be smaller than ${formatFileSize(typeConfig.maxSize)}`
        };
      }
      break;
    }
  }

  return { isValid: true, error: null };
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file type category
export const getFileTypeCategory = (fileName) => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  for (const [category, config] of Object.entries(uploadFileTypes)) {
    if (config.extensions.includes(extension)) {
      return category;
    }
  }
  
  return 'unknown';
};

// Get file icon based on type
export const getFileIcon = (fileName) => {
  const category = getFileTypeCategory(fileName);
  
  const icons = {
    images: '🖼️',
    documents: '📄',
    spreadsheets: '📊',
    presentations: '📽️',
    unknown: '📎'
  };
  
  return icons[category] || icons.unknown;
};