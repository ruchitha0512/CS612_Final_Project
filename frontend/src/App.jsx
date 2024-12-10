import { useState, useEffect } from "react";
import { Home, Search, User, LogOut, Loader } from "lucide-react";
import ContentFeed from "./components/ContentFeed";
import Profile from "./components/Profile";
import SearchBar from "./components/SearchBar";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";

const DEFAULT_AVATAR =
  "https://www.creativefabrica.com/wp-content/uploads/2023/04/15/Cute-Cat-Kawaii-Chibi-Graphic-67307453-1.png";

function App() {
  const { user, login, logout, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [trendingTags, setTrendingTags] = useState([]);
  const [error, setError] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrendingTags();
    }
  }, [isAuthenticated]);

  const fetchTrendingTags = async () => {
    try {
      setLoadingTags(true);
      const response = await fetch("/api/trending/tags", {
        headers: {
          "x-auth-token": localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch trending tags");
      }

      const tagsData = await response.json();
      setTrendingTags(tagsData);
    } catch (error) {
      console.error("Error fetching trending tags:", error);
      setError("Failed to load trending tags");
    } finally {
      setLoadingTags(false);
    }
  };

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;

    try {
      setLoadingTags(true);
      const response = await fetch(
        `/api/search/posts?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const searchResults = await response.json();
      return searchResults;
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
      return [];
    } finally {
      setLoadingTags(false);
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab("home");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader className="animate-spin text-violet-500" size={24} />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const NavItem = ({ icon: Icon, label, id }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl w-full transition-all ${
        activeTab === id
          ? "bg-violet-100 text-violet-600 font-medium"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon size={20} />
      <span className="hidden md:block text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-100 z-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-500 rounded-xl"></div>
              <span className="text-lg font-semibold text-violet-600">
                vibe
              </span>
            </div>

            {isAuthenticated && (
              <div className="flex-1 max-w-md mx-8">
                <SearchBar onSearch={handleSearch} />
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setActiveTab("profile")}
                >
                  <img
                    src={user?.avatar || DEFAULT_AVATAR}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-violet-600 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setIsAuthOpen(true);
                  }}
                  className="px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setIsAuthOpen(true);
                  }}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        <div className="flex gap-6">
          <aside className="hidden md:block w-56 fixed">
            <div className="space-y-1 pt-4">
              <NavItem icon={Home} label="Home" id="home" />
              {isAuthenticated && (
                <NavItem icon={User} label="Profile" id="profile" />
              )}
            </div>
          </aside>

          <main className="flex-1 md:ml-56 max-w-xl mx-auto">
            {!isAuthenticated ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Don't miss what's happening
                </h1>
                <p className="text-gray-600 mb-8">
                  People on Vibe are the first to know about what's happening.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsSignUp(true);
                      setIsAuthOpen(true);
                    }}
                    className="w-full max-w-xs px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Create account
                  </button>
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setIsSignUp(false);
                        setIsAuthOpen(true);
                      }}
                      className="text-violet-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            ) : activeTab === "profile" ? (
              <Profile />
            ) : (
              <ContentFeed />
            )}
          </main>

          {isAuthenticated && (
            <aside className="hidden lg:block w-72">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="font-semibold text-gray-900 mb-4">
                  Trending Tags
                </h2>
                {loadingTags ? (
                  <div className="flex justify-center py-4">
                    <Loader
                      className="animate-spin text-violet-500"
                      size={24}
                    />
                  </div>
                ) : error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : (
                  <div className="space-y-4">
                    {trendingTags.map((tag) => (
                      <div key={tag.tag} className="group cursor-pointer">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-violet-500 transition-colors">
                          #{tag.tag}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tag.count} posts
                        </p>
                      </div>
                    ))}
                    {trendingTags.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No trending tags yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="flex justify-around py-2">
          <NavItem icon={Home} id="home" />
          {isAuthenticated && <NavItem icon={User} id="profile" />}
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isSignUp={isSignUp}
        onSuccess={(data) => {
          login(data);
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}

export default App;
