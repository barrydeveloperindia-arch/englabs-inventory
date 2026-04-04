import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * @param file The File object to upload.
 * @param path The path in the storage bucket (e.g., 'staff/123/profile.jpg').
 * @returns Promise resolving to the download URL.
 */
// Helper to compress images before upload
export const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        console.log(`[Compression] Original: ${file.size}, Compressed: ${newFile.size}`);
                        resolve(newFile);
                    } else {
                        reject(new Error("Canvas to Blob failed"));
                    }
                }, 'image/jpeg', 0.5);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        console.log(`[Cloud Storage] Uploaded to ${path}: ${url}`);
        return url;
    } catch (error) {
        console.error("[Cloud Storage] Upload Failed:", error);
        throw error;
    }
};
