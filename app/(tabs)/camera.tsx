import React, { useEffect, useRef, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { FlipType, manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const ACCENT_COLOR = '#00BFFF';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [cameraType, setCameraType] = useState('back');
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);

  const rotateImage = async () => {
    if (photoUri) {
      const rotated = await manipulateAsync(photoUri, [{ rotate: 90 }], {
        compress: 0.6,
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
        {
          compress: 0.6,
          format: SaveFormat.JPEG,
        },
      );
      setPhotoUri(flipped.uri);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      setIsLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          skipProcessing: true,
        });
        setPhotoUri(photo.uri);
        console.log('Photo captured:', photo.uri);
      } catch (error) {
        console.error('Error capturing photo:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (hasPermission === null) return <View />;
  if (!hasPermission) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={cameraType}
        flash="off"
      />
      <Modal visible={!!photoUri} transparent animationType="fade">
        <View style={styles.modalContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={ACCENT_COLOR} />
          ) : (
            <Image
              source={{ uri: photoUri }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity onPress={rotateImage} style={styles.iconButton}>
              <Ionicons name="refresh-outline" size={40} color={ACCENT_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity onPress={flipImage} style={styles.iconButton}>
              <Ionicons
                name="swap-horizontal-outline"
                size={40}
                color={ACCENT_COLOR}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await Sharing.shareAsync(photoUri);
                  await FileSystem.deleteAsync(photoUri, { idempotent: true });
                  setPhotoUri(null);
                  Toast.show({
                    type: 'success',
                    text1: 'Compartido',
                    text2: 'Se abrió el diálogo para compartir.',
                    visibilityTime: 1500,
                  });
                } catch (error) {
                  console.error('Error sharing photo:', error);
                  await FileSystem.deleteAsync(photoUri, { idempotent: true });
                  setPhotoUri(null);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'No se pudo compartir la foto.',
                    visibilityTime: 1500,
                  });
                }
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                try {
                  const asset = await MediaLibrary.createAssetAsync(photoUri);
                  const album = await MediaLibrary.getAlbumAsync('picabit');
                  if (!album) {
                    await MediaLibrary.createAlbumAsync(
                      'picabit',
                      asset,
                      false,
                    );
                  } else {
                    await MediaLibrary.addAssetsToAlbumAsync(
                      [asset],
                      album,
                      false,
                    );
                  }
                  await FileSystem.deleteAsync(photoUri, { idempotent: true });
                  setPhotoUri(null);
                  Toast.show({
                    type: 'success',
                    text1: 'Guardado',
                    text2: 'La foto se ha guardado en picabit.',
                    visibilityTime: 1500,
                  });
                } catch (error) {
                  console.error('Error saving photo:', error);
                  await FileSystem.deleteAsync(photoUri, { idempotent: true });
                  setPhotoUri(null);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'No se pudo guardar la foto.',
                    visibilityTime: 1500,
                  });
                }
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={async () => {
              try {
                await FileSystem.deleteAsync(photoUri, { idempotent: true });
                setPhotoUri(null);
                Toast.show({
                  type: 'success',
                  text1: 'Descartado',
                  text2: 'La foto ha sido eliminada.',
                  visibilityTime: 1500,
                });
              } catch (error) {
                console.error('Error discarding photo:', error);
                setPhotoUri(null);
              }
            }}
            style={styles.iconButton}
          >
            <Ionicons name="trash-outline" size={40} color={ACCENT_COLOR} />
          </TouchableOpacity>
        </View>
      </Modal>
      <View style={styles.controls}>
        {!photoUri && (
          <View style={styles.mainControls}>
            <Pressable
              onPress={() =>
                setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))
              }
              style={styles.iconButton}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={60}
                color={ACCENT_COLOR}
              />
            </Pressable>
            <Pressable onPress={takePhoto} style={styles.iconButton}>
              <Ionicons name="camera-outline" size={60} color={ACCENT_COLOR} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  camera: { flex: 1 },
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
  },
  iconButton: {
    marginHorizontal: 30,
    backgroundColor: '#1F1F1F',
    padding: 10,
    borderRadius: 50,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(18,18,18,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: 300, height: 400, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'center' },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#FFC107',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  modalButtonText: { color: '#121212', fontWeight: 'bold' },
});
