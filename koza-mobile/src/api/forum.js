const API_BASE_URL = 'http://10.43.164.239:9000';

export const fetchForumPosts = async (category = null, query = null, authorId = null) => {
    try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (query) params.append('q', query);
        if (authorId) params.append('author_id', authorId);

        const response = await fetch(`${API_BASE_URL}/api/forum/posts?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        return await response.json();
    } catch (error) {
        console.error('Forum posts error:', error);
        return [];
    }
};

export const fetchPostDetails = async (postId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}`);
        if (!response.ok) throw new Error('Failed to fetch post');
        return await response.json();
    } catch (error) {
        console.error('Post details error:', error);
        return null;
    }
};

export const fetchPostComments = async (postId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/comments`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Comments error:', error);
        return [];
    }
};

export const createNewPost = async (title, content, categoryId, userId = 1) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/forum/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                content,
                category_id: categoryId,
                user_id: userId
            })
        });
        if (!response.ok) throw new Error('Failed to create post');
        return await response.json();
    } catch (error) {
        console.error('Create post error:', error);
        return null;
    }
};

export const submitComment = async (postId, content, userId = 1) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/forum/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_id: postId,
                user_id: userId,
                content
            })
        });
        if (!response.ok) throw new Error('Failed to submit comment');
        return await response.json();
    } catch (error) {
        console.error('Submit comment error:', error);
        return null;
    }
};

export const reportContent = async (type, id, reason) => {
    try {
        const endpoint = type === 'post' ? `/posts/${id}/report` : `/comments/${id}/report`;
        const response = await fetch(`${API_BASE_URL}/api/forum${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        return response.ok;
    } catch (error) {
        console.error('Report error:', error);
        return false;
    }
};
