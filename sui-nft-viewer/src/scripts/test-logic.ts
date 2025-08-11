// This is a script to test the NFT fetching logic.
// We need to configure path aliases for this to work outside of Next.js runtime.
// Or, use relative paths.

import { fetchNftsForAddress } from "../lib/sui-logic";

const testAddress = "0x061bc722123539169474515563914f6e49527a2b9e4a3e29e5cf8527b1b3b27a";

const runTest = async () => {
  console.log(`Fetching NFTs for address: ${testAddress}`);
  try {
    const nfts = await fetchNftsForAddress(testAddress);
    console.log("Fetched NFTs:", JSON.stringify(nfts, null, 2));
    if (nfts.length > 0) {
      console.log("Test successful!");
    } else {
      console.log("Test finished, but no NFTs were found.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
};

runTest();
