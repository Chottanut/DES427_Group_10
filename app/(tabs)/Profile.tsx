import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function ProfileScreen() {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [posts, setPosts] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);

  const toggleDropdown = async () => {
    const newState = !isDropdownVisible;
    setIsDropdownVisible(newState);
    if (newState) {
      await fetchFollowingList(); // refresh when dropdown opens
    }
  };

  const fetchUserProfile = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Error fetching user info:', userError);
      return;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('User')
      .select('U_Name')
      .eq('U_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile:', error);
      setUserName('Unknown');
      return;
    }

    setUserName(data.U_Name);
  };

  const fetchFollowingList = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Error getting current user:', userError);
      return;
    }

    const userId = userData.user.id;

    const { data: followingRows, error: followingError } = await supabase
      .from('Following')
      .select('Following_uid')
      .eq('U_id', userId);

    if (followingError) {
      console.error('Error fetching following UIDs:', followingError);
      return;
    }

    const followingUids = followingRows.map(row => row.Following_uid);

    if (followingUids.length === 0) {
      setFollowers([]);
      return;
    }

    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('U_Name')
      .in('U_id', followingUids);

    if (usersError) {
      console.error('Error fetching user names:', usersError);
      return;
    }

    const names = users.map(user => user.U_Name);
    setFollowers(names);
  };

  const fetchUserPosts = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Error getting user:', userError);
      return;
    }

    const { data: userPosts, error: fetchError } = await supabase
      .from('Post')
      .select('Image')
      .eq('U_id', userData.user.id)
      .order('Post_time', { ascending: false });

    if (fetchError) {
      console.error('Error fetching posts:', fetchError);
      return;
    }

    const urls = userPosts
      .flatMap(post => post.Image || [])
      .map((name: string) =>
        supabase.storage.from('photo1').getPublicUrl(name).data?.publicUrl
      )
      .filter(Boolean) as string[];

    setPosts(urls);
  };

  const createPost = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      Alert.alert('No image selected');
      return;
    }

    const uri = result.assets[0].uri;
    const imageName = `${uuidv4()}.jpg`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.readAsDataURL(blob);
      });

      const { error: uploadError } = await supabase.storage
        .from('photo1')
        .upload(imageName, decode(base64), { contentType: 'image/jpeg' });

      if (uploadError) {
        console.error(uploadError);
        Alert.alert('Failed to upload image');
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert("Couldn't get user info");
        return;
      }

      const { error: insertError } = await supabase.from('Post').insert([{
        U_id: userData.user.id,
        Post_Caption: '',
        Image: [imageName],
        Post_time: new Date().toISOString(),
        Post_date: new Date().toISOString().split('T')[0],
      }]);

      if (insertError) {
        console.error(insertError);
        Alert.alert('Failed to save post data');
      } else {
        Alert.alert('Post created!');
        await fetchUserPosts();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Something went wrong');
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
    fetchFollowingList();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {userName ? `@${userName}` : 'Loading...'}
          </Text>
          <TouchableOpacity onPress={toggleDropdown}>
            <Text style={styles.followInfo}>Following: {followers.length}</Text>
          </TouchableOpacity>
          {isDropdownVisible && (
            <View style={styles.dropdown}>
              {followers.map((f, i) => (
                <Text key={i} style={styles.dropdownItem}>{f}</Text>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardsContainer}>
        {posts.map((url, index) => (
          <View key={index} style={styles.card}>
            <Image
              source={{ uri: url }}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
              resizeMode="cover"
            />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.postButton} onPress={createPost}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d8d7e6' },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ddbaf3',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  userInfo: { marginLeft: 16 },
  username: { fontSize: 18, fontWeight: 'bold' },
  followInfo: { fontSize: 14, color: '#888' },
  dropdown: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  dropdownItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  postButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#1b1f36',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
