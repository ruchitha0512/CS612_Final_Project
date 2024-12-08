import { useState } from "react";
import { Search } from "lucide-react";

const SearchBar = ({ posts, setPosts }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      // Reset the filtered posts when search is cleared
      setPosts(posts.filter((post) => !post.isFiltered));
      return;
    }

    const filteredPosts = posts.map((post) => ({
      ...post,
      isFiltered: !(
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      ),
    }));

    setPosts(filteredPosts);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search posts..."
        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
      />
    </div>
  );
};

export default SearchBar;
