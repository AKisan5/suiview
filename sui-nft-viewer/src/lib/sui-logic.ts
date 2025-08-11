import { getSuiClient } from "@mysten/sui/client";

// Initialize the Sui Client
const suiClient = getSuiClient({
  url: "https://fullnode.mainnet.sui.io",
});

export const fetchNftsForAddress = async (address: string) => {
  try {
    // getOwnedObjects with showDisplay should be enough.
    const objects = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showType: true,
        showDisplay: true,
      },
    });

    // Filter for objects that are likely NFTs
    const nftObjects = objects.data.filter((obj) => {
      return obj.data?.display?.data && !obj.data?.type?.startsWith("0x2::coin::Coin");
    });

    if (nftObjects.length === 0) {
      return [];
    }

    const formattedNfts = nftObjects
      .map((obj) => {
        const displayData = obj.data?.display?.data;
        return {
          id: obj.data?.objectId || "",
          name: displayData?.name || "No Name",
          // Handle IPFS URLs
          imageUrl: (displayData?.image_url || "").replace("ipfs://", "https://ipfs.io/ipfs/"),
        };
      });

    return formattedNfts;
  } catch (err) {
    console.error("Error fetching NFTs:", err);
    throw err;
  }
};
