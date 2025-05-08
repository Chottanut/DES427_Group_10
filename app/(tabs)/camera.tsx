import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../utils/supabase';
import { decode } from 'base64-arraybuffer';
const App: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!mediaPermission) {
        await requestMediaPermission();
      }
    })();
  }, []);

  if (!cameraPermission) return <View />;

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <Button onPress={requestCameraPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        if (!photo?.uri) {
          alert('Failed to take picture.');
          return;
        }
        setImage(photo.uri);
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
    } catch (err) {
      console.error('Error taking picture:', err);
      Alert.alert('Camera error', 'Failed to take picture.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('ImagePicker error:', err);
    }
  };

const uploadImage = async () => {
  if (!image) {
    Alert.alert('No image selected');
    return;
  }

  setUploading(true);

  try {
    const response = await fetch(image);
    if (!response.ok) throw new Error(`Failed to fetch image. Status: ${response.status}`);

    const blob = await response.blob();

    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // get base64 data
        } else {
          reject('Failed to convert blob to base64');
        }
      };
      reader.readAsDataURL(blob);
    });

    const fileName = `${uuidv4()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('photo1')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      Alert.alert('Upload failed', uploadError.message);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      Alert.alert('User fetch failed');
      return;
    }

    const { error: insertError } = await supabase
      .from('Post')
      .insert([{
        U_id: userData.user.id,
        Post_Caption: caption,
        Image: [fileName],
        Post_time: new Date().toISOString(),
        Post_date: new Date().toISOString().split('T')[0],
      }]);

    if (insertError) {
      console.error('Insert error:', insertError);
      Alert.alert('Failed to save post data');
      return;
    }

    Alert.alert('Upload successful!');
    setImage(null);
    setCaption('');
  } catch (err: any) {
    console.error('Upload error:', err);
    Alert.alert('Upload failed. Please check your internet connection.');
  } finally {
    setUploading(false);
  }
};


  return (
    <View style={styles.container}>
      {!image ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}>Take Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.text}>Pick Image</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            value={caption}
            onChangeText={setCaption}
            multiline
          />
          <Button
            title={uploading ? 'Uploading...' : 'Post to Profile'}
            onPress={uploadImage}
            disabled={uploading}
            color="#4287f5"
          />
          {uploading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
          <Button title="Cancel" onPress={() => setImage(null)} color="#ff5c5c" />
        </View>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 0.2,
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: '#00000080',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.3,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
  },
  previewImage: {
    width: '90%',
    height: '60%',
    borderRadius: 10,
    marginBottom: 15,
  },
  captionInput: {
    width: '90%',
    height: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  loader: {
    marginVertical: 10,
  },
});
