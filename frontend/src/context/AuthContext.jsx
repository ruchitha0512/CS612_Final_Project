import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

const DEFAULT_AVATAR =
  "https://www.creativefabrica.com/wp-content/uploads/2023/04/15/Cute-Cat-Kawaii-Chibi-Graphic-67307453-1.png";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    try {
      const response = await fetch("/api/users/me", {
        headers: {
          "x-auth-token": token,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          ...userData,
          avatar: userData.avatar || DEFAULT_AVATAR,
        });
      } else {
        // Clear invalid token
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Don't remove token on network errors to prevent unnecessary logouts
      if (error.message !== "Failed to fetch") {
        localStorage.removeItem("token");
        setUser(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    // Set initial user state from localStorage if available
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user data");
      }
    }

    checkAuth();
  }, []);

  const login = (data) => {
    try {
      if (!data || !data.token) {
        throw new Error("Invalid login data");
      }

      // Set token
      localStorage.setItem("token", data.token);

      // Set user data
      const userData = {
        id: data.user.id,
        name: data.user.name,
        handle: data.user.handle,
        avatar: data.user.avatar || DEFAULT_AVATAR,
        email: data.user.email,
      };

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
