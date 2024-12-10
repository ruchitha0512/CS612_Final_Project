import React, { useState, useEffect } from "react";
import { Mail, Lock, User, AtSign, X, Image, FileText } from "lucide-react";

const DEFAULT_AVATAR =
  "https://www.creativefabrica.com/wp-content/uploads/2023/04/15/Cute-Cat-Kawaii-Chibi-Graphic-67307453-1.png";

const AuthModal = ({ isOpen, onClose, onSuccess, isSignUp }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    handle: "",
    bio: "",
    avatar: "",
  });
  const [previewError, setPreviewError] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        handle: "",
        bio: "",
        avatar: "",
      });
      setError("");
      setPreviewError(false);
    }
  }, [isOpen, isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/register" : "/api/login";
      const body = isSignUp
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            handle: formData.handle,
            bio: formData.bio,
            avatar: formData.avatar.trim() || DEFAULT_AVATAR,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      console.log("Submitting form with data:", body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 400 &&
          data.message?.includes("already exists")
        ) {
          throw new Error("Email or username is already taken");
        }
        throw new Error(data.message || "Authentication failed");
      }

      if (!data.token) {
        throw new Error("No token received from server");
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "handle") {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));
      return;
    }

    if (name === "avatar") {
      setPreviewError(false);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarError = () => {
    console.log("Avatar preview failed to load");
    setPreviewError(true);
  };

  const getDisplayAvatar = () => {
    if (previewError || !formData.avatar.trim()) {
      return DEFAULT_AVATAR;
    }
    return formData.avatar;
  };

  const validateForm = () => {
    if (!isSignUp) {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return false;
      }
      return true;
    }

    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.handle
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (formData.handle.length < 3) {
      setError("Username must be at least 3 characters long");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (formData.name.length < 2) {
      setError("Name must be at least 2 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />

        <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-violet-600">
              {isSignUp ? "Create Account" : "Welcome Back!"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-gray-300 pl-10 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      minLength={2}
                      maxLength={255}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="handle"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      id="handle"
                      name="handle"
                      type="text"
                      placeholder="johndoe"
                      className="w-full rounded-lg border border-gray-300 pl-10 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      value={formData.handle}
                      onChange={handleInputChange}
                      required
                      minLength={3}
                      maxLength={255}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Only letters, numbers, and underscores allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Bio (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself..."
                      rows="3"
                      className="w-full rounded-lg border border-gray-300 pl-10 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      value={formData.bio}
                      onChange={handleInputChange}
                      maxLength={1000}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="avatar"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Profile Picture URL (Optional)
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      id="avatar"
                      name="avatar"
                      type="url"
                      placeholder="https://example.com/your-image.jpg"
                      className="w-full rounded-lg border border-gray-300 pl-10 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      value={formData.avatar}
                      onChange={handleInputChange}
                      maxLength={255}
                    />
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200">
                      <img
                        key={formData.avatar}
                        src={getDisplayAvatar()}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                        onError={handleAvatarError}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {previewError ? (
                        <span className="text-red-500">
                          Invalid image URL, using default
                        </span>
                      ) : formData.avatar.trim() ? (
                        "Preview"
                      ) : (
                        "Default avatar"
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 pl-10 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 pl-10 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  onClose();
                }}
                className="ml-1 text-violet-600 hover:underline font-medium"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
