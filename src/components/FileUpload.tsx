import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface UploadedFile {
  file: File;
  preview?: string;
  validationStatus: 'valid' | 'invalid' | 'pending';
  validationError?: string;
  uploadProgress: number;
}

export interface FileValidationState {
  isValid: boolean;
  error?: string;
  mimeType: string;
  fileSize: number;
}

export interface FileUploadProps {
  acceptedTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  onUploadSuccess?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  onFileRemove?: (file: UploadedFile) => void;
  onOCRTrigger?: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const DEFAULT_ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIME_TYPE_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates file type and size
 */
export const validateFile = (
  file: File,
  acceptedMimeTypes: string[] = DEFAULT_ACCEPTED_TYPES,
  maxFileSize: number = DEFAULT_MAX_FILE_SIZE
): FileValidationState => {
  const mimeType = file.type;
  const fileSize = file.size;

  // Check MIME type
  if (!acceptedMimeTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: `Invalid file type. Accepted types: ${DEFAULT_ACCEPTED_EXTENSIONS.join(', ').toUpperCase()}`,
      mimeType,
      fileSize,
    };
  }

  // Check file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!DEFAULT_ACCEPTED_EXTENSIONS.includes(fileExtension || '')) {
    return {
      isValid: false,
      error: `Invalid file extension. Accepted types: ${DEFAULT_ACCEPTED_EXTENSIONS.join(', ').toUpperCase()}`,
      mimeType,
      fileSize,
    };
  }

  // Check file size
  if (fileSize > maxFileSize) {
    const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Your file is ${(fileSize / (1024 * 1024)).toFixed(1)}MB.`,
      mimeType,
      fileSize,
    };
  }

  // Check for empty files
  if (fileSize === 0) {
    return {
      isValid: false,
      error: 'File is empty. Please select a valid file.',
      mimeType,
      fileSize,
    };
  }

  return {
    isValid: true,
    mimeType,
    fileSize,
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get display filename
 */
export const sanitizeFilename = (filename: string, maxLength: number = 40): string => {
  if (filename.length <= maxLength) return filename;
  const ext = filename.split('.').pop();
  const nameWithoutExt = filename.replace(`.${ext}`, '');
  return nameWithoutExt.substring(0, maxLength - ext!.length - 3) + '...' + ext;
};

/**
 * Check if file is image
 */
export const isImageFile = (mimeType: string): boolean => {
  return ['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType);
};

/**
 * Check if file is PDF
 */
export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

/**
 * Create preview for image files
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// PREVIEW COMPONENT
// ============================================================================

interface FilePreviewProps {
  file: UploadedFile;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const isImage = isImageFile(file.file.type);
  const isPdf = isPdfFile(file.file.type);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isImage && file.preview ? (
          <div className="flex-shrink-0">
            <img
              src={file.preview}
              alt={file.file.name}
              className="w-12 h-12 object-cover rounded"
            />
          </div>
        ) : isPdf ? (
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded flex items-center justify-center">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-blue-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={file.file.name}>
            {sanitizeFilename(file.file.name)}
          </p>
          <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
        </div>

        {file.validationStatus === 'valid' && (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
        {file.validationStatus === 'invalid' && (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        )}
      </div>

      <button
        onClick={onRemove}
        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
        aria-label={`Remove ${file.file.name}`}
        disabled={file.validationStatus === 'pending'}
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FileUpload: React.FC<FileUploadProps> = ({
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  multiple = false,
  onUploadSuccess,
  onUploadError,
  onFileRemove,
  onOCRTrigger,
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // =========================================================================
  // FILE PROCESSING
  // =========================================================================

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setGlobalError(null);
      const filesToProcess = multiple ? Array.from(files) : [files[0]];

      const processedFiles: UploadedFile[] = [];

      for (const file of filesToProcess) {
        // Validate file
        const validation = validateFile(file, acceptedTypes, maxFileSize);

        if (!validation.isValid) {
          setGlobalError(validation.error || 'Invalid file');
          onUploadError?.(validation.error || 'Invalid file');
          continue;
        }

        // Create preview for images
        let preview: string | undefined;
        if (isImageFile(file.type)) {
          try {
            preview = await createImagePreview(file);
          } catch (error) {
            console.error('Failed to create preview:', error);
          }
        }

        const uploadedFile: UploadedFile = {
          file,
          preview,
          validationStatus: 'valid',
          uploadProgress: 0,
        };

        processedFiles.push(uploadedFile);

        // Trigger OCR processing if callback provided
        if (onOCRTrigger) {
          onOCRTrigger(file);
        }
      }

      if (processedFiles.length > 0) {
        setUploadedFiles(processedFiles);
        onUploadSuccess?.(processedFiles);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [acceptedTypes, maxFileSize, multiple, onUploadSuccess, onUploadError, onOCRTrigger]
  );

  // =========================================================================
  // DRAG AND DROP HANDLERS
  // =========================================================================

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const { files } = e.dataTransfer;
      processFiles(files);
    },
    [processFiles, disabled]
  );

  // =========================================================================
  // CLICK HANDLERS
  // =========================================================================

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
    },
    [processFiles]
  );

  const handleRemoveFile = useCallback(
    (fileToRemove: UploadedFile) => {
      // Clean up preview URL
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      setUploadedFiles((prev) => prev.filter((f) => f !== fileToRemove));
      onFileRemove?.(fileToRemove);
    },
    [onFileRemove]
  );

  // =========================================================================
  // CLEANUP
  // =========================================================================

  useEffect(() => {
    return () => {
      // Cleanup preview URLs on unmount
      uploadedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className={`w-full ${className}`}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative
          p-8
          border-2 border-dashed
          rounded-lg
          cursor-pointer
          transition-all
          duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            handleClick();
          }
        }}
        aria-label="File upload drop zone"
        aria-disabled={disabled}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          disabled={disabled}
          className="hidden"
          aria-label="File input"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className={`
            p-3 rounded-full
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <Upload className={`
              w-6 h-6
              ${isDragging ? 'text-blue-600' : 'text-gray-600'}
            `} />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">
              {isDragging ? 'Drop your files here' : 'Drag and drop your files here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Accepted formats: {DEFAULT_ACCEPTED_EXTENSIONS.map(ext => ext.toUpperCase()).join(', ')}
            {' '} • Max size: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      </div>

      {/* Error Message */}
      {globalError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{globalError}</p>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <FilePreview
                key={`${file.file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveFile(file)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
