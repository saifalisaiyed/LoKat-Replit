import { useState } from "react";

export function usePhotoCapture() {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [faceCount, setFaceCount] = useState(0);

  return {
    capturedUri, setCapturedUri,
    processedUri, setProcessedUri,
    isCapturing, setIsCapturing,
    isUploading, setIsUploading,
    isProcessingFaces, setIsProcessingFaces,
    faceCount, setFaceCount,
  };
}
