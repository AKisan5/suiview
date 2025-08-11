"use client";

import { useState } from "react";
import { fetchNftsForAddress } from "@/lib/sui-logic";

// Define a type for our NFT data
type NFT = {
  id: string;
  name: string;
  imageUrl: string;
};

export default function Home() {
  const [address, setAddress] = useState("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchNFTs = async () => {
    if (!address) {
      setError("Please enter a Sui address.");
      return;
    }
    setLoading(true);
    setError(null);
    setNfts([]);

    try {
      const fetchedNfts = await fetchNftsForAddress(address);
      setNfts(fetchedNfts);
      if (fetchedNfts.length === 0) {
        setError("No NFTs found for this address.");
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Failed to fetch NFTs. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Sui NFT Viewer</h1>
      <div className="flex w-full max-w-xl items-center space-x-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Sui Address"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleFetchNFTs}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
        >
          {loading ? "Fetching..." : "Fetch NFTs"}
        </button>
      </div>

      {error && !loading && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-12 w-full max-w-6xl">
        {loading ? (
          <p>Loading...</p>
        ) : nfts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <img src={nft.imageUrl} alt={nft.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !error && <p className="text-gray-400">Enter an address to search for NFTs.</p>
        )}
      </div>
    </main>
  );
}
