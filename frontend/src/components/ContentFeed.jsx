
import { useState, useEffect } from "react";
import {
  Image,
  Smile,
  MessageCircle,
  Heart,
  X,
  Loader,
  Calendar,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEFAULT_AVATAR =
  "https://www.creativefabrica.com/wp-content/uploads/2023/04/15/Cute-Cat-Kawaii-Chibi-Graphic-67307453-1.png";

const ContentFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [newTag, setNewTag] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError("Failed to load posts");
      console.error("Posts fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum size is 5MB.");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setSelectedMedia(data.fileUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && !selectedMedia) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          content: newPost,
          media: selectedMedia,
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const newPostData = await response.json();
      setPosts([newPostData, ...posts]);
      setNewPost("");
      setSelectedTags([]);
      setSelectedMedia("");
    } catch (err) {
      setError("Failed to create post");
      console.error("Post creation error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to like post");
      }

      const { liked } = await response.json();

      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: liked ? post.likes_count + 1 : post.likes_count - 1,
              is_liked: liked,
            };
          }
          return post;
        }),
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const removeSelectedImage = () => {
    setSelectedMedia("");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Post Creation */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-3">
          <img
            src={user?.avatar || DEFAULT_AVATAR}
            alt={user?.name}
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div className="flex-1">
            <textarea
              placeholder="Share your thoughts..."
              className="w-full p-3 text-gray-700 bg-gray-50 rounded-xl border-0 focus:ring-1 focus:ring-violet-500 text-sm resize-none"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows="3"
            />

            {/* Image Preview */}
            {selectedMedia && (
              <div className="mt-3 relative">
                <img
                  src={selectedMedia}
                  alt="Post preview"
                  className="max-h-64 rounded-lg object-cover"
                />
                <button
                  onClick={removeSelectedImage}
                  className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full text-white hover:bg-gray-900/75"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Tag Input */}
            <div className="mt-3">
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-1 text-sm bg-gray-50 rounded-lg border-0 focus:ring-1 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-violet-100 text-violet-600 text-sm font-medium rounded-lg hover:bg-violet-200 transition-colors"
                >
                  Add Tag
                </button>
              </form>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-lg bg-violet-100 text-violet-600 text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() =>
                        setSelectedTags(selectedTags.filter((t) => t !== tag))
                      }
                      className="ml-2 text-violet-400 hover:text-violet-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                <div className="relative">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`p-2 rounded-lg cursor-pointer flex items-center ${
                      uploadingImage
                        ? "text-gray-400"
                        : "text-gray-400 hover:text-violet-500"
                    }`}
                  >
                    {uploadingImage ? (
                      <Loader className="animate-spin" size={20} />
                    ) : (
                      <Image size={20} />
                    )}
                  </label>
                </div>
                <button className="p-2 text-gray-400 hover:text-violet-500 rounded-lg">
                  <Smile size={20} />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={
                  submitting ||
                  (!newPost.trim() && !selectedMedia) ||
                  uploadingImage
                }
                className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader className="animate-spin" size={16} />
                    Posting...
                  </span>
                ) : (
                  "Post"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 text-sm text-red-500 bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="animate-spin text-violet-500" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex gap-3">
                <img
                  src={post.avatar || DEFAULT_AVATAR}
                  alt={post.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.name}</span>
                      <span className="text-gray-500 text-sm">
                        @{post.handle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} />
                      <span className="text-sm">
                        {formatDate(post.created_at)}
                      </span>
                      {post.user_id === user?.id && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-gray-900">{post.content}</p>

                  {post.media && (
                    <img
                      src={post.media}
                      alt="Post media"
                      className="mt-3 max-h-96 rounded-lg object-cover"
                    />
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-violet-500 text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-6">
                    <button className="group flex items-center gap-2 text-gray-500 hover:text-violet-500">
                      <MessageCircle size={18} />
                      <span className="text-sm">
                        {post.comments_count || 0}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`group flex items-center gap-2 ${
                        post.is_liked
                          ? "text-pink-500"
                          : "text-gray-500 hover:text-pink-500"
                      }`}
                    >
                      <Heart
                        size={18}
                        className={post.is_liked ? "fill-current" : ""}
                      />
                      <span className="text-sm">{post.likes_count || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  );
};

export default ContentFeed;
