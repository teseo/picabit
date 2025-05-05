import React, { useEffect, useRef, useState } from 'react';
import {
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
import { FlipType, manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<CameraView | null>(null);

  const [status, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    if (status?.status !== 'granted') {
      requestPermission();
    }
  }, [status]);

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
        let finalUri = photo.uri;

        if (cameraType === 'front') {
          const manipulated = await manipulateAsync(
            photo.uri,
            [{ flip: FlipType.Horizontal }],
            { compress: 1, format: SaveFormat.JPEG },
          );
          finalUri = manipulated.uri;
        }

        // Only set the photo for preview; do not save yet
        setPhotoUri(finalUri);
        console.log('Photo captured for preview (not saved):', finalUri);
      } catch (error) {
        console.error('Error capturing photo:', error);
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

  const savePhotoManually = async () => {
    if (photoUri) {
      try {
        const asset = await MediaLibrary.createAssetAsync(photoUri);
        const album = await MediaLibrary.getAlbumAsync('picabit');
        if (!album) {
          await MediaLibrary.createAlbumAsync('picabit', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        console.log('Manually saved photo to system album: picabit');
      } catch (error) {
        console.error('Error saving photo to gallery:', error);
      }
    }
  };

  const sharePhoto = async () => {
    if (photoUri) {
      try {
        await Sharing.shareAsync(photoUri);
      } catch (error) {
        console.error('Error sharing photo:', error);
      }
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
      <Modal visible={!!photoUri} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={photoUri ? { uri: photoUri } : undefined}
            style={{ width: 300, height: 400, marginBottom: 20 }}
            resizeMode="contain"
          />
          <View style={{ width: '90%' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginBottom: 10,
              }}
            >
              <TouchableOpacity onPress={rotateImage} style={styles.iconButton}>
                <Ionicons name="refresh-outline" size={40} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={flipImage} style={styles.iconButton}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={40}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginBottom: 10,
              }}
            >
              <TouchableOpacity onPress={sharePhoto} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Compartir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={savePhotoManually}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setPhotoUri(null)}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={40} color="white" />
              </TouchableOpacity>
            </View>
          </View>
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
              <Ionicons name="sync-outline" size={40} color="white" />
            </Pressable>
            <Pressable onPress={takePhoto} style={styles.iconButton}>
              <Ionicons name="camera-outline" size={60} color="white" />
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
  },
  editControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  iconButton: {
    marginHorizontal: 30,
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
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFit: {
    width: '100%',
    height: '100%',
  },
  modalButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
