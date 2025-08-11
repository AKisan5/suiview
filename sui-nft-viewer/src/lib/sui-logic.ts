import { SuiClient } from "@mysten/sui/client";

// Constants for Kiosk types
const KIOSK_OWNER_CAP_TYPE = "0x2::kiosk::KioskOwnerCap";

// Define a type for our NFT data
export type NFT = {
  id: string;
  name: string;
  imageUrl: string;
};

// Initialize the Sui Client
const suiClient = new SuiClient({
  url: "https://fullnode.mainnet.sui.io",
});

export const fetchNftsForAddress = async (address: string): Promise<NFT[]> => {
  const allObjectIds = new Set<string>();

  try {
    // 1. Fetch all objects owned by the address
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: address,
      options: { showContent: true, showType: true },
    });

    // 2. Find the Kiosk Owner Cap to get the Kiosk ID
    const kioskOwnerCap = ownedObjects.data.find(
      (obj) => obj.data?.type === KIOSK_OWNER_CAP_TYPE
    );

    if (kioskOwnerCap) {
      // Extract the kiosk ID from the KioskOwnerCap object's content
      const kioskId = (kioskOwnerCap.data?.content as any)?.fields?.for;

      if (kioskId) {
        // 3. Fetch the dynamic fields of the kiosk
        let hasNextPage = true;
        let nextCursor: string | null = null;
        while (hasNextPage) {
          const kioskFields = await suiClient.getDynamicFields({
            parentId: kioskId,
            cursor: nextCursor,
          });
          kioskFields.data.forEach((field) => {
            // The objectId in the dynamic field is the ID of the NFT
            allObjectIds.add(field.objectId);
          });
          nextCursor = kioskFields.nextCursor;
          hasNextPage = kioskFields.hasNextPage;
        }
      }
    }

    // 4. Add directly owned objects that might be NFTs (and are not Kiosks/Caps)
    ownedObjects.data.forEach((obj) => {
      if (obj.data?.type && !obj.data.type.includes("kiosk")) {
        allObjectIds.add(obj.data.objectId);
      }
    });

    if (allObjectIds.size === 0) {
      return [];
    }

    // 5. Fetch the details for all collected object IDs
    const uniqueIds = Array.from(allObjectIds);
    const objectDetails = await suiClient.multiGetObjects({
      ids: uniqueIds,
      options: { showDisplay: true },
    });

    // 6. Format the results into the NFT type
    const formattedNfts = objectDetails
      .filter((detail) => detail.data?.display?.data) // Filter for objects with display data
      .map((detail) => {
        const displayData = detail.data?.display?.data;
        return {
          id: detail.data?.objectId || "",
          name: displayData?.name || "No Name",
          imageUrl: (displayData?.image_url || "")
            .replace("ipfs://", "https://ipfs.io/ipfs/")
            .replace("ar://", "https://arweave.net/"), // Also handle arweave
        };
      });

    return formattedNfts;
  } catch (err) {
    console.error("Error fetching NFTs:", err);
    // It's better to return an empty array or re-throw, depending on UI handling
    return [];
  }
};
