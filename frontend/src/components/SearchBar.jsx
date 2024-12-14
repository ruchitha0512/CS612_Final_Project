import { useState } from "react";
import { Search } from "lucide-react";

const SearchBar = ({ setSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]); // State to hold search results

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setResults([]); // Clear results if search query is empty
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(`/api/search/users?q=${query}`, {
        headers: {
          "x-auth-token": token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch search results. Status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data); // Update the results state
      setSearchResults(data); // Pass results to parent if needed
    } catch (err) {
      console.error("Search error:", err.message);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search users by name..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Render search results */}
      {results.length > 0 && (
        <ul className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-md z-10">
          {results.map((user) => (
            <li
              key={user.id}
              className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer space-x-4"
              onClick={() => console.log(`Selected user: ${user.name}`)} // Define an action here
            >
              {/* Avatar */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm text-white">
                  {user.name?.charAt(0) || "?"}
                </div>
              )}

              {/* User Details */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                {user.handle && (
                  <span className="text-xs text-gray-500">@{user.handle}</span>
                )}
                {user.email && (
                  <span className="text-xs text-gray-400">{user.email}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
