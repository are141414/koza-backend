import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchForumPosts, createNewPost } from '../api/forum';
import { getTimeAgo } from '../utils/pregnancy';
import { getData, storeData, CACHE_KEYS } from '../utils/cache';

export default function ForumScreen() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showNewTopicModal, setShowNewTopicModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('1');
    const [userId, setUserId] = useState(null);

    const categories = [
        { id: '1', name: 'Genel' },
        { id: '2', name: 'Sağlık' },
        { id: '3', name: 'Beslenme' },
        { id: '4', name: 'Yaşam Tarzı' },
    ];

    useEffect(() => {
        loadPosts();
        loadUser();
    }, []);

    const loadUser = async () => {
        const profile = await getData(CACHE_KEYS.USER_PROFILE);
        if (profile && profile.user_id) {
            setUserId(profile.user_id);
        }
    };

    const loadPosts = async (isRefresh = false) => {
        // ... (loading logic)

        try {
            const data = await fetchForumPosts();
            if (Array.isArray(data) && data.length > 0) {
                setPosts(data);
                storeData(CACHE_KEYS.FORUM_POSTS, data); // Update cache
            } else if (!posts.length) {
                // Use mock data if API returns empty and no posts shown
                const mockData = [
                    {
                        id: 1,
                        title: "Hamilelik İlk Ayı",
                        content: "İlk ayda neler yaşadınız?",
                        author: "Ayşe",
                        created_at: "2026-01-27",
                        category: "Genel",
                        comments_count: 5
                    },
                    {
                        id: 2,
                        title: "Beslenme Önerileri",
                        content: "Hamilelikte hangi besinler önemli?",
                        author: "Fatma",
                        created_at: "2026-01-26",
                        category: "Beslenme",
                        comments_count: 12
                    }
                ];
                setPosts(mockData);
            }
        } catch (error) {
            console.error('Forum load error:', error);
            if (!posts.length) {
                // Fallback to mock data on error
                setPosts([
                    {
                        id: 1,
                        title: "Hamilelik İlk Ayı",
                        content: "İlk ayda neler yaşadınız?",
                        author: "Ayşe",
                        created_at: "2026-01-27",
                        category: "Genel",
                        comments_count: 5
                    },
                    {
                        id: 2,
                        title: "Beslenme Önerileri",
                        content: "Hamilelikte hangi besinler önemli?",
                        author: "Fatma",
                        created_at: "2026-01-26",
                        category: "Beslenme",
                        comments_count: 12
                    }
                ]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPosts();
        loadUser();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadPosts(true);
    };

    const handleCreatePost = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            alert('Lütfen başlık ve içeriği doldurun');
            return;
        }

        if (!userId) {
            alert('Gönderi paylaşmak için oturum açmalısınız.');
            // Usually we might redirect to Setup, but user should be setup by now.
            return;
        }

        const success = await createNewPost(
            newTitle,
            newContent,
            parseInt(selectedCategory),
            userId
        );

        if (success) {
            alert('Konu başarıyla oluşturuldu!');
            setNewTitle('');
            setNewContent('');
            setShowNewTopicModal(false);
            loadPosts(true); // Force refresh
        } else {
            alert('Konu oluşturulamadı. Lütfen tekrar deneyin.');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF9A9E" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Forum</Text>
                    <Text style={styles.subtitle}>Diğer annelerle paylaş</Text>
                </View>

                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowNewTopicModal(true)}
                >
                    <Text style={styles.createButtonText}>+ Yeni Konu Başlat</Text>
                </TouchableOpacity>

                {posts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Henüz konu yok</Text>
                    </View>
                ) : (
                    posts.map((post) => (
                        <View key={post.id} style={styles.postCard}>
                            <View style={styles.postHeader}>
                                <View
                                    style={[
                                        styles.avatar,
                                        {
                                            backgroundColor:
                                                '#' +
                                                Math.floor(Math.random() * 16777215).toString(16),
                                        },
                                    ]}
                                />
                                <View style={styles.postMeta}>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <Text style={styles.authorName}>
                                            {post.author_name || "Anonim"}
                                        </Text>
                                        {post.author_badge && (
                                            <View style={{backgroundColor:'#FFD1D4', borderRadius:4, paddingHorizontal:4, marginLeft:5}}>
                                                <Text style={{fontSize:10, color:'#D45D79'}}>{post.author_badge}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.postTime}>
                                        {getTimeAgo(post.created_at)}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.postTitle}>{post.title}</Text>
                            <View style={styles.postFooter}>
                                <Text style={styles.commentCount}>💬 Yorum yap</Text>
                            </View>
                        </View>
                    ))
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* New Topic Modal */}
            <Modal
                visible={showNewTopicModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNewTopicModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yeni Konu</Text>
                            <TouchableOpacity onPress={() => setShowNewTopicModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Başlık"
                            placeholderTextColor="#999"
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <TextInput
                            style={[styles.input, styles.contentInput]}
                            placeholder="İçerik"
                            placeholderTextColor="#999"
                            value={newContent}
                            onChangeText={setNewContent}
                            multiline
                            numberOfLines={6}
                        />

                        <View style={styles.categoryPicker}>
                            <Text style={styles.categoryLabel}>Kategori:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory === cat.id &&
                                                styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setSelectedCategory(cat.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryButtonText,
                                                selectedCategory === cat.id &&
                                                    styles.categoryButtonTextActive,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleCreatePost}
                        >
                            <Text style={styles.submitButtonText}>Gönder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF9A9E',
    },
    subtitle: {
        fontSize: 13,
        color: '#999',
        marginTop: 4,
    },
    createButton: {
        marginHorizontal: 15,
        marginVertical: 15,
        backgroundColor: '#FF9A9E',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    postCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginVertical: 8,
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    postMeta: {
        flex: 1,
    },
    authorName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    postTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    postTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 8,
    },
    commentCount: {
        fontSize: 12,
        color: '#FF9A9E',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        paddingBottom: 30,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF9A9E',
    },
    closeButton: {
        fontSize: 24,
        color: '#999',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 12,
        color: '#333',
    },
    contentInput: {
        textAlignVertical: 'top',
        height: 100,
    },
    categoryPicker: {
        marginBottom: 15,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    categoryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 16,
        marginRight: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#FF9A9E',
        borderColor: '#FF9A9E',
    },
    categoryButtonText: {
        fontSize: 12,
        color: '#666',
    },
    categoryButtonTextActive: {
        color: '#FFF',
    },
    submitButton: {
        backgroundColor: '#FF9A9E',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
});
