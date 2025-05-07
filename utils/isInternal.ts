import * as FileSystem from 'expo-file-system';

export default function isInternal(uri: string): boolean {
  return (
    uri.startsWith(FileSystem.cacheDirectory ?? '') ||
    uri.startsWith(FileSystem.documentDirectory ?? '')
  );
}
