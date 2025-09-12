import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';

// Compress image before upload
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            // Clean up object URL
            URL.revokeObjectURL(objectUrl);
            
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

// Generate unique filename
function generateFileName(originalName, memberId, type = 'profile') {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop().toLowerCase();
  return `${type}/${memberId}/${timestamp}_${randomString}.${extension}`;
}

// Upload single image (profile picture)
export async function uploadProfileImage(file, memberId) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to upload images');
  }

  try {
    // Compress image for profile pictures (smaller size)
    const compressedFile = await compressImage(file, 400, 400, 0.8);
    
    // Generate storage path
    const fileName = generateFileName(file.name, memberId, 'profile');
    const storageRef = ref(storage, `family-images/${fileName}`);
    
    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error(`Failed to upload profile image: ${error.message}`);
  }
}

// Upload multiple gallery images
export async function uploadGalleryImages(files, memberId) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to upload images');
  }

  try {
    const uploadPromises = files.map(async (file, index) => {
      // Compress image for gallery (larger than profile but still optimized)
      const compressedFile = await compressImage(file, 1200, 900, 0.85);
      
      // Generate storage path
      const fileName = generateFileName(file.name, memberId, 'gallery');
      const storageRef = ref(storage, `family-images/${fileName}`);
      
      // Upload to Firebase Storage
      const snapshot = await uploadBytes(storageRef, compressedFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        fileName: fileName,
        originalName: file.name,
        size: compressedFile.size,
        uploadedAt: new Date()
      };
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading gallery images:', error);
    throw new Error(`Failed to upload gallery images: ${error.message}`);
  }
}

// Delete image from storage
export async function deleteImage(imagePath) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to delete images');
  }

  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    console.log('Image deleted successfully:', imagePath);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Delete multiple images
export async function deleteImages(imagePaths) {
  if (!auth.currentUser) {
    throw new Error('Authentication required to delete images');
  }

  try {
    const deletePromises = imagePaths.map(path => {
      const imageRef = ref(storage, path);
      return deleteObject(imageRef);
    });
    
    await Promise.all(deletePromises);
    console.log('Images deleted successfully:', imagePaths);
  } catch (error) {
    console.error('Error deleting images:', error);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
}

// Create image preview URL from file
export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Validate image file
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload images smaller than 10MB.');
  }

  return true;
}

// Batch validate multiple files
export function validateImageFiles(files) {
  const maxFiles = 10;
  
  if (files.length > maxFiles) {
    throw new Error(`Too many files. Maximum ${maxFiles} images allowed.`);
  }

  files.forEach((file, index) => {
    try {
      validateImageFile(file);
    } catch (error) {
      throw new Error(`File ${index + 1}: ${error.message}`);
    }
  });

  return true;
}