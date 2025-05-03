import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, View } from 'react-native';
import { Camera, CameraView } from 'expo-camera';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false)
    return (
      <View>
        <Button title="No access to camera" onPress={() => {}} />
      </View>
    );

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <>
          <CameraView style={styles.camera} ref={cameraRef} />
          <Button title="Take Photo" onPress={takePhoto} />
        </>
      ) : (
        <>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <Button title="Retake" onPress={() => setPhotoUri(null)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  preview: { flex: 1 },
});
