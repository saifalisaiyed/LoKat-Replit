---
name: Face blur pipeline
description: How automatic face blurring works in the camera screen before photo submission
---

# Face Blur Pipeline

## Architecture
On-device face detection (expo-face-detector, Expo Go compatible) + server-side Gaussian blur (sharp via POST /api/photos/blur-faces).

## Flow
1. LoKater takes photo → `handleCapture` sets `capturedUri` and calls `processFacesAsync(uri)` (non-blocking, native only)
2. `processFacesAsync`: dynamic import of `expo-face-detector` → `detectFacesAsync` → face bounds in image coordinates
3. If faces found: POST multipart to `/api/photos/blur-faces` with image file + faces JSON
4. Server: auto-rotates per EXIF, extracts each face region, blurs with sharp sigma=28, composites back, returns base64 JPEG
5. Client saves result to `expo-file-system` cache dir → sets `processedUri`
6. Preview shows `processedUri ?? capturedUri`; Send button blocked while processing
7. `handleSubmit` uploads `processedUri ?? capturedUri` — blurred image goes to GCS

## Key decisions
- **Fails silently**: every error path in `processFacesAsync` falls through to `finally { setIsProcessingFaces(false) }` — the original image is always uploadable
- **Web skip**: `processFacesAsync` only called when `Platform.OS !== 'web'` (expo-face-detector not available on web)
- **EXIF rotation**: sharp `.rotate()` (no args) applied before extract so face bounds from expo-face-detector (which sees the visual orientation) match the pixel data
- **multer** setup is inside `registerRoutes` as a local variable (not module-level) to avoid startup failures
- **Body size**: multer limit is 20MB (separate from the 10kb JSON body limit — multer handles multipart independently)

**Why:**
Mobile photos submitted through LoKat could capture bystanders' faces. Auto-blurring before upload protects privacy without requiring manual action from the LoKater.
