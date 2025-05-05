import React, { useEffect, useRef, useState } from 'react';
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
import { Camera, CameraType, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { FlipType, manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const ACCENT_COLOR = '#00BFFF';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isLoading, setIsLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cameraRef = useRef(null);

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
        setRotation(0);
        setIsFlipped(false);
        console.log('Photo captured:', photo.uri);
      } catch (error) {
        console.error('Error capturing photo:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const processImageForSave = async () => {
    const actions = [];
    if (rotation !== 0) actions.push({ rotate: rotation });
    if (isFlipped) actions.push({ flip: FlipType.Horizontal });
    if (actions.length === 0 || !photoUri) return { uri: photoUri || '' }; // no changes or no photo
    return await manipulateAsync(photoUri, actions, {
      compress: 0.6,
      format: SaveFormat.JPEG,
    });
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
          <Image
            source={photoUri ? { uri: photoUri } : undefined}
            style={[
              styles.image,
              {
                transform: [
                  { rotate: `${rotation}deg` },
                  { scaleX: isFlipped ? -1 : 1 },
                ],
              },
            ]}
            resizeMode="contain"
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={ACCENT_COLOR} />
            </View>
          )}
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity
              onPress={() => setRotation((prev) => (prev + 90) % 360)}
              style={styles.iconButton}
            >
              <Ionicons name="refresh-outline" size={40} color={ACCENT_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsFlipped((prev) => !prev)}
              style={styles.iconButton}
            >
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
                setIsLoading(true);
                try {
                  const processed = await processImageForSave();
                  await Sharing.shareAsync(processed.uri);
                  await FileSystem.deleteAsync(processed.uri, {
                    idempotent: true,
                  });
                  setPhotoUri(null);
                  Toast.show({
                    type: 'success',
                    text1: 'Compartido',
                    text2: 'Se abrió el diálogo para compartir.',
                    visibilityTime: 1500,
                  });
                } catch (error) {
                  console.error('Error sharing photo:', error);
                  setPhotoUri(null);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'No se pudo compartir la foto.',
                    visibilityTime: 1500,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setIsLoading(true);
                try {
                  const processed = await processImageForSave();
                  const asset = await MediaLibrary.createAssetAsync(
                    processed.uri,
                  );
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
                  await FileSystem.deleteAsync(processed.uri, {
                    idempotent: true,
                  });
                  setPhotoUri(null);
                  Toast.show({
                    type: 'success',
                    text1: 'Guardado',
                    text2: 'La foto se ha guardado en picabit.',
                    visibilityTime: 1500,
                  });
                } catch (error) {
                  console.error('Error saving photo:', error);
                  setPhotoUri(null);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'No se pudo guardar la foto.',
                    visibilityTime: 1500,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={async () => {
              setIsLoading(true);
              try {
                if (photoUri != null) {
                  await FileSystem.deleteAsync(photoUri, { idempotent: true });
                }
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
              } finally {
                setIsLoading(false);
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
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
