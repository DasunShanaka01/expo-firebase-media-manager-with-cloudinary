import { Alert, Button, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '@/FirebaseConfig'; // Make sure db is exported from FirebaseConfig
import { User, onAuthStateChanged } from 'firebase/auth';
import { FlatList } from 'react-native';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dkp01emhb',
  uploadPreset: 'adadadad',
};

// Firestore data model for user-uploaded media
interface MediaItem {
  id: string;         // Firestore document ID
  url: string;        // Cloudinary URL of the uploaded media
  userId: string;     // ID of the user who uploaded
  uploadedAt: Date;   // Date when the media was uploaded
  filename: string;   // Original filename of the uploaded media
}

export default function TabTwoScreen() {
  const [media, setMedia] = useState<string | null>(null);           // Currently selected file
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);       // List of uploaded media
  const [user, setUser] = useState<User | null>(null);               // Current logged-in user
  const [uploading, setUploading] = useState(false);                 // Upload in progress
  const [loading, setLoading] = useState(false);                     // Loading user's media

  // Load user's media from Firestore -  Load User's Existing Media
  const loadUserMedia = async (userId: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'userMedia'),
        where('userId', '==', userId)
        // Temporarily removed orderBy until index is created
        // orderBy('uploadedAt', 'desc')
      );
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      const mediaItems: MediaItem[] = [];
      
      // Convert each document to MediaItem format
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        mediaItems.push({
          id: doc.id,
          url: data.url,
          userId: data.userId,
          uploadedAt: data.uploadedAt.toDate(),
          filename: data.filename,
        });
      });
      
      // Sort by upload date (newest first) after fetching
      mediaItems.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
      
      setMediaList(mediaItems);
      console.log(`Loaded ${mediaItems.length} media items for user ${userId}`);
    } catch (error) {
      console.error('Error loading user media:', error);
      Alert.alert('Error', 'Failed to load your media');
    } finally {
      setLoading(false);
    }
  };

  // Save media URL to Firestore -Save URL to Database
  const saveMediaToFirestore = async (url: string, filename: string) => {
    if (!user) return;
    
    try {

      // Create a new document in the 'userMedia' collection
      const docRef = await addDoc(collection(db, 'userMedia'), {
        url,                    // Cloudinary URL
        userId: user.uid,       // Current user's ID
        filename,              // Original filename
        uploadedAt: new Date(), // Current timestamp
      });
      
      // Create the media item for local state
      const newMediaItem: MediaItem = {
        id: docRef.id,    // Firestore generated this ID
        url,
        userId: user.uid,
        uploadedAt: new Date(),
        filename,
      };

      // Add to the beginning of the list (newest first)
      setMediaList((prev) => [newMediaItem, ...prev]);
      console.log('Media saved to Firestore with ID:', docRef.id);
    } catch (error) {
      console.error('Error saving media to Firestore:', error);
      Alert.alert('Error', 'Failed to save media reference');
    }
  };

  //Select Media from Device
  const pickMedia = async () => {
    try {
      // Ask for permission to access photos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is required to pick files.');
        return;
      }

       // Open the media picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      // If user selected something
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const mediaUri = result.assets[0].uri;    // Get file path
        console.log('Media picked successfully:', mediaUri);   // Save it to state
        setMedia(mediaUri);
      } else {
        console.log('Media selection canceled or failed');
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Pick Failed', 'Could not pick media.');
    }
  };

  // Upload to Cloudinary and Save to Database
  const uploadMedia = async () => {
    // Check if we have a user and selected media
    if (!user || !media) {
      const errorMsg = !user ? 'No user logged in' : 'No media selected';
      console.log('Upload failed due to:', errorMsg);
      Alert.alert('Upload Failed', errorMsg);
      return;
    }

    setUploading(true); // Show "Uploading..." button
    console.log('Attempting to upload media:', media);
    console.log('Current user:', user?.uid);

    try {
      // Prepare the file for upload
      const formData = new FormData();
      
      // Get file extension (jpg, png, mp4, etc.)
      const uriParts = media.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // Determine the correct MIME type
      let mimeType = 'image/jpeg';
      if (['jpg', 'jpeg'].includes(fileType.toLowerCase())) {
        mimeType = 'image/jpeg';
      } else if (fileType.toLowerCase() === 'png') {
        mimeType = 'image/png';
      } else if (['mp4', 'mov', 'avi'].includes(fileType.toLowerCase())) {
        mimeType = 'video/mp4';
      } else if (['mp3', 'wav', 'm4a'].includes(fileType.toLowerCase())) {
        mimeType = 'audio/mp3';
      }
      
      // Create a unique filename
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileType}`;
      
      // Add the file to form data
      formData.append('file', {
        uri: media,
        type: mimeType,
        name: filename,
      } as any);
      
      // Add Cloudinary settings
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', user.uid);

      // Prepare the file data for upload to Cloudinary.
      const uploadResponse = await fetch(   // Upload to Cloudinary
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await uploadResponse.json();
      console.log('Upload response:', result);

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${result.error?.message || uploadResponse.status}`);
      }

      const url = result.secure_url;  // This is the Cloudinary URL where file is now stored
      
      // Save the URL to Firestore database
      await saveMediaToFirestore(url, filename);

      setMedia(null);
      console.log('Media uploaded and saved successfully:', url);
      Alert.alert('Success', 'Media uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading media:', error);
      Alert.alert('Upload Failed', error.message || 'Network request failed. Check your connection.');
    } finally {
      setUploading(false);
    }
  };

  // Remove Media
  const deleteMedia = async (mediaItem: MediaItem) => {
    try {
      // Delete from Firestore database
      await deleteDoc(doc(db, 'userMedia', mediaItem.id));
      
      // Remove from local state
      setMediaList((prev) => prev.filter((item) => item.id !== mediaItem.id));
      
      console.log('Media deleted from Firestore:', mediaItem.id);
      Alert.alert('Success', 'Media deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting media:', error);
      Alert.alert('Delete Failed', error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log('User logged in:', currentUser.uid);
        loadUserMedia(currentUser.uid); // Load their media when they log in
      } else {
        console.log('No user logged in');
        setMediaList([]);     // Clear media when they log out
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>User Media</Text>
      <TouchableOpacity onPress={pickMedia} style={styles.pickButton}>
        <Text style={styles.buttonText}>Pick Image, Audio, or Video</Text>
      </TouchableOpacity>
      
      {media && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: media }} style={styles.previewImage} />
          <Button 
            title={uploading ? "Uploading..." : "Upload Media"} 
            onPress={uploadMedia} 
            disabled={!media || !user || uploading} 
          />
        </View>
      )}
      
      {loading ? (
        <Text style={styles.loadingText}>Loading your media...</Text>
      ) : (
        <FlatList
          data={mediaList}
          renderItem={({ item }) => (
            <View style={styles.mediaItem}>
              <Image source={{ uri: item.url }} style={styles.media} />
              <Text style={styles.mediaInfo}>
                Uploaded: {item.uploadedAt.toLocaleDateString()}
              </Text>
              <Button title="Delete" onPress={() => deleteMedia(item)} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No media yet!</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 16,
    color: '#333'
  },
  pickButton: { 
    padding: 16, 
    backgroundColor: '#007AFF', 
    borderRadius: 8, 
    marginBottom: 16,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  previewImage: { 
    width: 200, 
    height: 200, 
    resizeMode: 'contain', 
    marginBottom: 16,
    borderRadius: 8
  },
  mediaItem: { 
    alignItems: 'center', 
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8
  },
  media: { 
    width: 200, 
    height: 200, 
    resizeMode: 'contain',
    marginBottom: 8,
    borderRadius: 8
  },
  mediaInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666'
  },
  listContainer: { 
    paddingBottom: 20 
  },
  emptyText: { 
    textAlign: 'center', 
    padding: 20, 
    color: '#666',
    fontSize: 16
  },
});