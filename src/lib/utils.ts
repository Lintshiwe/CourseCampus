import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileNameFromUrl(url: string): string {
  if (!url) return '';
  try {
      const pathWithToken = url.split('/o/')[1];
      const path = pathWithToken.split('?')[0];
      const decodedPath = decodeURIComponent(path);
      const filename = decodedPath.substring(decodedPath.lastIndexOf('/') + 1);
      const userFriendlyName = filename.substring(filename.indexOf('_') + 1);
      return userFriendlyName || filename;
  } catch (e) {
      console.error("Error extracting filename:", e);
      return 'Unknown file';
  }
}
