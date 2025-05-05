import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { useCameraPermissions } from 'expo-camera';

// Hook que gestiona los permisos de cámara y media
const usePermissions = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] =
    useState<MediaLibrary.PermissionResponse | null>(null);

  useEffect(() => {
    // Solicitar permisos de galería
    const requestMediaPermissions = async () => {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(mediaPermission);
    };

    // Solicitar permisos de cámara si no se han concedido
    if (!cameraPermission?.granted) {
      void requestCameraPermission();
    }

    // Solicitar permisos de galería
    void requestMediaPermissions();
  }, [cameraPermission, requestCameraPermission]);

  return { cameraPermission, mediaPermission };
};

export default usePermissions;
