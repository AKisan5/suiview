import { SuiClient } from "@mysten/sui/client";

// --- Whitelist of NFT Collection Types ---
const WHITELISTED_TYPES = new Set([
  "0x5c182ac631580a793c1e156477d130a2182283a31c51a140f2d8a4d2e706f9d4::rootlet::Rootlet",
  "0x6e0d8d73319a27c302636a2a099d57a91632832873130a0a55ad51c51e06d9d3::suins_registration::SuinsRegistration",
  "0xa926c4ba65d86895395a163e3d489b532a297e5967f5f4b3602f9c3c54d89a20::anima_gensis_avatar::AnimaGenesisAvatar",
  "0xe9be6e2c342733475d6811200922e434f415c1e30d6ad7a42b10221c567a508f::citizen_nft::CitizenNft",
  "0xb71a7d6fe229bd129e7c5387431e785a2105d1de72f10b7b13783c162233261a::suiplay_preorder_nft::SuiplayPreorderNFT",
  "0x9e13a403061730bcc5703f8a0026e0b04a93a8080f33d76e3b5e4c49cc8b7e28::suigirl_nft::Suigirl",
  "0x034c162f6b594cb5a1805264dd01ca5d80ce3eca6522e6ee37fd9ebfb9d3ddca::factory::PrimeMachin",
]);

const KIOSK_TYPE = "0x2::kiosk::Kiosk";

export type NFT = {
  id: string;
  name: string;
  imageUrl: string;
};

const suiClient = new SuiClient({
  url: "https://fullnode.mainnet.sui.io",
});

export const fetchNftsForAddress = async (address: string): Promise<NFT[]> => {
  const whitelistedObjectIds = new Set<string>();

  try {
    const ownedKiosks = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: KIOSK_TYPE },
      options: { showContent: true },
    });

    const kioskItemsPromises = ownedKiosks.data.map(kiosk =>
        suiClient.getOwnedObjects({
            owner: kiosk.data?.objectId ?? "",
            options: { showType: true }
        })
    );
    const kioskItemsResponses = await Promise.all(kioskItemsPromises);

    kioskItemsResponses.forEach(response => {
        response.data.forEach(item => {
            if (item.data?.type && WHITELISTED_TYPES.has(item.data.type)) {
                whitelistedObjectIds.add(item.data.objectId);
            }
        });
    });

    const directlyOwnedObjects = await suiClient.getOwnedObjects({
        owner: address,
        options: { showType: true }
    });

    directlyOwnedObjects.data.forEach((obj) => {
      if (obj.data?.type && WHITELISTED_TYPES.has(obj.data.type)) {
        whitelistedObjectIds.add(obj.data.objectId);
      }
    });

    if (whitelistedObjectIds.size === 0) {
      return [];
    }

    const finalIds = Array.from(whitelistedObjectIds);
    const finalObjectDetails = await suiClient.multiGetObjects({
      ids: finalIds,
      options: { showDisplay: true, showContent: true }, // Added showContent
    });

    const formattedNfts = finalObjectDetails
      .filter((detail) => detail.data) // Ensure data exists
      .map((detail) => {
        const displayData = detail.data?.display?.data;
        const fields = detail.data?.content?.fields as any;

        const name = displayData?.name || fields?.name || "No Name";
        let imageUrl = displayData?.image_url || fields?.image_url || fields?.url || "";

        imageUrl = (imageUrl || "")
          .replace("ipfs://", "https://ipfs.io/ipfs/")
          .replace("ar://", "https://arweave.net/");

        return {
          id: detail.data?.objectId || "",
          name,
          imageUrl,
        };
      });

    return formattedNfts.filter(nft => nft.imageUrl); // Only return NFTs with an image
  } catch (err) {
    console.error("Error fetching whitelisted NFTs:", err);
    return [];
  }
};
