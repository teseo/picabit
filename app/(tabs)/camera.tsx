import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { FlipType, manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
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
      try {
        if (cameraType === 'front') {
          const manipulated = await manipulateAsync(
            photo.uri,
            [{ flip: FlipType.Horizontal }],
            { compress: 1, format: SaveFormat.JPEG },
          );
          setPhotoUri(manipulated.uri);
        } else {
          setPhotoUri(photo.uri);
        }
      } catch (error) {
        console.error('Error flipping image:', error);
        setPhotoUri(photo.uri);
      }
    }
  };

  const rotateImage = async () => {
    if (photoUri) {
      const rotated = await manipulateAsync(photoUri, [{ rotate: 90 }], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      setPhotoUri(rotated.uri);
    }
  };

  const flipImage = async () => {
    if (photoUri) {
      const flipped = await manipulateAsync(
        photoUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 1, format: SaveFormat.JPEG },
      );
      setPhotoUri(flipped.uri);
    }
  };

  if (hasPermission === null) return <View />;
  if (!hasPermission)
    return (
      <View>
        <Pressable onPress={() => {}}>
          <Ionicons name="camera-reverse" size={32} color="white" />
        </Pressable>
      </View>
    );

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={cameraType}
        flash="off"
      />
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.overlayImage} />
      )}
      <View style={styles.controls}>
        <View style={styles.mainControls}>
          {!photoUri && (
            <>
              <Pressable
                onPress={() =>
                  setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))
                }
                style={styles.iconButton}
              >
                <Ionicons name="sync-outline" size={40} color="white" />
              </Pressable>
              <Pressable onPress={takePhoto} style={styles.iconButton}>
                <Ionicons name="camera-outline" size={60} color="white" />
              </Pressable>
            </>
          )}
          {photoUri && (
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={styles.iconButton}
            >
              <Ionicons name="refresh-outline" size={40} color="white" />
            </Pressable>
          )}
        </View>
        {photoUri && (
          <View style={styles.editControls}>
            <Pressable onPress={rotateImage} style={styles.iconButton}>
              <Ionicons name="refresh-circle-outline" size={40} color="white" />
            </Pressable>
            <Pressable onPress={flipImage} style={styles.iconButton}>
              <Ionicons
                name="swap-horizontal-outline"
                size={40}
                color="white"
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  preview: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  editControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  iconButton: {
    marginHorizontal: 20,
  },
  overlayImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  retaker: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 30,
  },
});
