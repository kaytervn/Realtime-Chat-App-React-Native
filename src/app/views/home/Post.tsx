import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useFetch from "../../hooks/useFetch";
import { LoadingDialog } from "@/src/components/Dialog";
import { PostModel } from "@/src/models/post/PostModel";
import PostItem from "@/src/components/post/PostItem";

const Post = ({ navigation }: any) => {
  const { get, loading } = useFetch();
  const [loadingDialog, setLoadingDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<PostModel[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const isInitialMount = useRef(true);

  const size = 4;

  const tabs = [
    { title: "Cộng đồng", getMyPosts: 0, getMyFriendPosts: 0 },
    { title: "Bạn bè", getMyPosts: 0, getMyFriendPosts: 1 },
    { title: "Tôi", getMyPosts: 1, getMyFriendPosts: 0 },
  ];

  const handleSearch = async () => {
    setLoadingDialog(true);
    try {
      const res = await get(`/v1/post/list`, {
        content: searchQuery.trim(),
        page: 0,
        size,
        getMyPosts: tabs[activeTab].getMyPosts,
        getMyFriendPosts: tabs[activeTab].getMyFriendPosts
      });
      setPosts(res.data.content);
      setHasMore(true);
      setPage(0);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoadingDialog(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(0);
    fetchData(0);
  };

  const fetchData = useCallback(async (pageNumber: number) => {
    if (!hasMore && pageNumber !== 0) return;
    try {
      const res = await get(`/v1/post/list`, {
        page: pageNumber,
        size,
        getMyPosts: tabs[activeTab].getMyPosts,
        getMyFriendPosts: tabs[activeTab].getMyFriendPosts
      });
      const newPosts = res.data.content;
      if (pageNumber === 0) {
        setPosts(newPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      }
      setHasMore(newPosts.length === size);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingDialog(false);
    }
  }, [get, hasMore, size, activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    setPage(0);
    fetchData(0).then(() => setRefreshing(false));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchData(page + 1);
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setPage(0);
    setSearchQuery("");
    setHasMore(true);
    setPosts([]);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      fetchData(0);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData(0);
  }, []);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts found</Text>
    </View>
  );

  const renderItem = ({ item }: { item: PostModel }) => (
    <TouchableOpacity
      onPress={() => 
        navigation.navigate("PostDetail", {postId:item._id})
      } 
    >
      <PostItem post={item} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loadingDialog && <LoadingDialog isVisible={loadingDialog} />}
    
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search posts..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => handleTabChange(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => `${item._id} - ${index}`}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={() => 
          loading && hasMore ? <ActivityIndicator size="large" color="#007AFF" /> : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal:10,
    marginTop:15
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    marginLeft: 12,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default Post;