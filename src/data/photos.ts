import * as ImagePicker from 'expo-image-picker';

/**
 * Cross-platform photo capture.
 *
 * On native, opens the system camera. On web, expo-image-picker compiles down
 * to a hidden <input type="file" accept="image/*"> + capture="environment" on
 * mobile browsers, which triggers the camera; on desktop browsers it falls
 * back to a file chooser. Either way the API is identical.
 *
 * Returns:
 *   - `data:image/...` URL on web (base64) — safe to persist in IndexedDB
 *   - file URI (file://...) on native — persistable in expo-sqlite blob refs
 *   - null if the user cancelled or permission was denied
 */
export async function capturePhoto(): Promise<string | null> {
  // Native: ask camera permission before launching. On web, the picker handles
  // this itself via the browser's file-input UI.
  if (ImagePicker.requestCameraPermissionsAsync) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted' && perm.status !== undefined) {
      // 'undefined' status comes from web where the API isn't applicable;
      // we treat that as "proceed and let the file dialog handle it"
      if (perm.status === 'denied') return null;
    }
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      // base64 gives us a data URL we can persist directly on web.
      base64: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType ?? 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    }
    return asset.uri ?? null;
  } catch {
    // Fallback to library picker if camera not available (e.g. desktop browsers)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (asset.base64) {
      const mime = asset.mimeType ?? 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    }
    return asset.uri ?? null;
  }
}
