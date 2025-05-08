import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  TouchableHighlight,
} from 'react-native';
import { supabase } from '../../utils/supabase';

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = async (query: string = '') => {
    let matchingUids: string[] = [];

    // Step 1: if searching, find matching U_ids by display name
    if (query.trim()) {
      const { data: users, error: userError } = await supabase
        .from('User')
        .select('U_id')
        .ilike('U_Name', `%${query.trim()}%`);

      if (userError) {
        console.error('User search failed:', userError);
        return;
      }

      matchingUids = users.map(user => user.U_id);
      if (matchingUids.length === 0) {
        setPosts([]); // no match
        return;
      }
    }

    // Step 2: get posts
    let supabaseQuery = supabase
      .from('Post')
      .select(
        `
        *,
        User (
          U_Name
        )
      `
      )
      .order('Post_time', { ascending: false });

    if (matchingUids.length > 0) {
      supabaseQuery = supabaseQuery.in('U_id', matchingUids);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Post fetch error:', error);
      return;
    }

    setPosts(data);

    if (currentUserId) {
      const status: { [key: string]: boolean } = {};
      for (const post of data) {
        const posterId = post.U_id;
        if (posterId === currentUserId) {
          status[posterId] = false;
          continue;
        }
        const { data: followData } = await supabase
          .from('Following')
          .select('U_id')
          .eq('U_id', currentUserId)
          .eq('Following_uid', posterId)
          .maybeSingle();
        status[posterId] = !!followData;
      }
      setFollowingStatus(status);
    }
  };

  const fetchCurrentUserId = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {
      console.error('Fetch user failed:', error);
      return;
    }
    setCurrentUserId(userData.user.id);
  };

  useEffect(() => {
    fetchCurrentUserId();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchPosts(); // default load
    }
  }, [currentUserId]);

  const handleFollowToggle = async (posterId: string) => {
    if (!currentUserId) return;

    const isFollowing = followingStatus[posterId];

    if (isFollowing) {
      const { error } = await supabase
        .from('Following')
        .delete()
        .match({ U_id: currentUserId, Following_uid: posterId });

      if (error) {
        console.error('Unfollow failed:', error);
      } else {
        setFollowingStatus(prev => ({ ...prev, [posterId]: false }));
      }
    } else {
      const { error } = await supabase
        .from('Following')
        .insert([{ U_id: currentUserId, Following_uid: posterId }]);

      if (error) {
        console.error('Follow failed:', error);
      } else {
        setFollowingStatus(prev => ({ ...prev, [posterId]: true }));
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/guri_logo.png')}
          style={styles.logo}
        />
      </View>


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by display name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableHighlight onPress={() => fetchPosts(searchQuery)} underlayColor="white">
          <View style={styles.searchButton}>
            <Image
              style={{ height: 30, width: 30 }}
              source={require('../../assets/button_images/search_icon.png')}
            />
          </View>
        </TouchableHighlight>
      </View>

      {/* Posts */}
      {posts.map((post, index) => {
        const posterId = post.U_id;
        const isFollowing = followingStatus[posterId] || false;
        const imageUrl =
          post.Image && post.Image.length > 0
            ? supabase.storage.from('photo1').getPublicUrl(post.Image[0]).data?.publicUrl
            : null;

        return (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.posterName}>{post.User?.U_Name ?? 'Unknown User'}</Text>
              {posterId !== currentUserId && (
                <TouchableOpacity
                  style={styles.followButton}
                  onPress={() => handleFollowToggle(posterId)}
                >
                  <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {imageUrl && (
              <Image source={{ uri: imageUrl }} style={styles.postImage} resizeMode="cover" />
            )}

            <Text style={styles.cardDate}>
              {post.Post_time ? new Date(post.Post_time).toLocaleString() : ''}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d8d7e6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#d8d7e6',
  },
  logo: {
    width: 68,
    height: 68,
    backgroundColor: '#1b1f36',
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  searchButton: {
    padding: 5,
  },
  card: {
    backgroundColor: '#1b1f36',
    margin: 16,
    borderRadius: 10,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posterName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  followButton: {
    backgroundColor: '#ddbaf3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  followText: {
    color: '#000',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  cardDate: {
    color: '#fff',
    marginVertical: 8,
  },
});
