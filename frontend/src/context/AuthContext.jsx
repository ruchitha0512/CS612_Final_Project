import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext(null);

const DEFAULT_AVATAR =
  "https://www.creativefabrica.com/wp-content/uploads/2023/04/15/Cute-Cat-Kawaii-Chibi-Graphic-67307453-1.png";

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Auth query to check user session
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        return null;
      }

      try {
        // Use stored user data while validating
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Using stored user data:", parsedUser); // Debug log
          queryClient.setQueryData(["auth"], parsedUser);
        }

        const response = await fetch("/api/users/me", {
          headers: {
            "x-auth-token": token,
          },
        });

        if (!response.ok) {
          throw new Error("Invalid token");
        }

        const userData = await response.json();
        console.log("Received user data from API:", userData); // Debug log

        // Keep the existing avatar if it exists, otherwise use the provided one or default
        const updatedUser = {
          ...userData,
          avatar: userData.avatar || DEFAULT_AVATAR,
        };

        console.log("Updated user data:", updatedUser); // Debug log

        // Update stored user data
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      } catch (error) {
        console.error("Auth error:", error); // Debug log
        if (error.message !== "Failed to fetch") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
    retry: false,
  });

  const login = async (data) => {
    try {
      console.log("Login data received:", data); // Debug log

      if (!data || !data.token) {
        throw new Error("Invalid login data");
      }

      localStorage.setItem("token", data.token);

      const userData = {
        id: data.user.id,
        name: data.user.name,
        handle: data.user.handle,
        avatar: data.user.avatar,
        email: data.user.email,
        bio: data.user.bio,
      };

      console.log("Storing user data:", userData); // Debug log

      localStorage.setItem("user", JSON.stringify(userData));
      queryClient.setQueryData(["auth"], userData);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      queryClient.setQueryData(["auth"], null);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    queryClient.setQueryData(["auth"], null);
    // Invalidate all queries on logout
    queryClient.clear();
  };

  const updateUser = (userData) => {
    console.log("Updating user with:", userData); // Debug log

    const currentUser = queryClient.getQueryData(["auth"]);
    const updatedUser = {
      ...currentUser,
      ...userData,
      // Ensure avatar persists unless explicitly changed
      avatar: userData.avatar || currentUser?.avatar || DEFAULT_AVATAR,
    };

    console.log("Updated user state:", updatedUser); // Debug log

    localStorage.setItem("user", JSON.stringify(updatedUser));
    queryClient.setQueryData(["auth"], updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        login,
        logout,
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

export default AuthContext;
