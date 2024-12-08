import { useState, useEffect } from "react";
import { Edit2, Save, Loader, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEFAULT_AVATAR =
  "https://www.creativefabrica.com/wp-content/uploads/2023/04/15/Cute-Cat-Kawaii-Chibi-Graphic-67307453-1.png";

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    handle: "",
    bio: "",
    avatar: DEFAULT_AVATAR,
    posts_count: 0,
    likes_given_count: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.handle) return;

    try {
      const response = await fetch(`/api/users/${user.handle}`, {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError("Failed to load profile data");
      console.error("Profile fetch error:", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      // Update profile info
      const profileResponse = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to update profile");
      }

      // If avatar was changed, update it separately
      if (profile.avatar !== user.avatar) {
        const avatarResponse = await fetch("/api/profile/avatar", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({
            avatar: profile.avatar,
          }),
        });

        if (!avatarResponse.ok) {
          throw new Error("Failed to update avatar");
        }
      }

      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      setError("Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarError = () => {
    setProfile((prev) => ({
      ...prev,
      avatar: DEFAULT_AVATAR,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full border-2 border-violet-100 object-cover"
              onError={handleAvatarError}
            />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full">
                  <input
                    type="url"
                    value={
                      profile.avatar === DEFAULT_AVATAR ? "" : profile.avatar
                    }
                    onChange={(e) =>
                      handleEdit("avatar", e.target.value || DEFAULT_AVATAR)
                    }
                    placeholder="Enter image URL"
                    className="absolute bottom-0 left-0 w-full px-2 py-1 text-xs bg-black/50 text-white placeholder-white/75"
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleEdit("name", e.target.value)}
                className="text-xl font-bold mb-1 bg-gray-50 rounded-lg px-3 py-1 border border-violet-200 focus:outline-none focus:border-violet-500"
                placeholder="Your name"
              />
            ) : (
              <h1 className="text-xl font-bold">{profile.name}</h1>
            )}
            <p className="text-gray-500">{profile.handle}</p>
          </div>
        </div>
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader className="animate-spin" size={18} />
          ) : isEditing ? (
            <Save size={18} />
          ) : (
            <Edit2 size={18} />
          )}
          <span>{loading ? "Saving..." : isEditing ? "Save" : "Edit"}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Bio */}
      <div className="mb-6">
        {isEditing ? (
          <textarea
            value={profile.bio || ""}
            onChange={(e) => handleEdit("bio", e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-lg text-gray-700 min-h-[100px] border border-violet-200 focus:outline-none focus:border-violet-500"
            placeholder="Write something about yourself..."
          />
        ) : (
          <p className="text-gray-700">{profile.bio || "No bio yet"}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6 py-4 border-t border-gray-100">
        <div className="text-center">
          <span className="block text-2xl font-bold text-violet-600">
            {profile.posts_count || 0}
          </span>
          <span className="text-gray-500 text-sm">Posts</span>
        </div>
        <div className="text-center">
          <span className="block text-2xl font-bold text-violet-600">
            {profile.likes_given_count || 0}
          </span>
          <span className="text-gray-500 text-sm">Likes Given</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
