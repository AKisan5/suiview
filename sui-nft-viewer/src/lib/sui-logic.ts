import { SuiClient } from "@mysten/sui/client";

// --- Whitelist of NFT Collection Types ---
const WHITELISTED_TYPES = new Set([
  "0x5c182ac631580a793c1e156477d130a2182283a31c51a140f2d8a4d2e706f9d4::rootlet::Rootlet",
  "0x6e0d8d73319a27c302636a2a099d57a91632832873130a0a55ad51c51e06d9d3::suins_registration::SuinsRegistration",
  "0xa926c4ba65d86895395a163e3d489b532a297e5967f5f4b3602f9c3c54d89a20::anima_gensis_avatar::AnimaGenesisAvatar",
  "0xe9be6e2c342733475d6811200922e434f415c1e30d6ad7a42b10221c567a508f::citizen_nft::CitizenNft",
  "0xb71a7d6fe229bd129e7c5387431e785a2105d1de72f10b7b13783c162233261a::suiplay_preorder_nft::SuiplayPreorderNFT",
  "0x9e13a403061730bcc5703f8a0026e0b04a93a8080f33d76e3b5e4c49cc8b7e28::suigirl_nft::Suigirl",
  "0xc90d40c74b281fcfb7941793fb04513813a48e4745914d7a71e843f55d55cb73::machine::Machine",
]);

const KIOSK_OWNER_CAP_TYPE = "0x2::kiosk::KioskOwnerCap";

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
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: address,
      options: { showContent: true, showType: true },
    });

    // Handle directly owned NFTs
    ownedObjects.data.forEach((obj) => {
      if (obj.data?.type && WHITELISTED_TYPES.has(obj.data.type)) {
        whitelistedObjectIds.add(obj.data.objectId);
      }
    });

    // Handle Kiosk-owned NFTs
    const kioskOwnerCap = ownedObjects.data.find(
      (obj) => obj.data?.type === KIOSK_OWNER_CAP_TYPE
    );

    if (kioskOwnerCap) {
      const kioskId = (kioskOwnerCap.data?.content as any)?.fields?.for;
      if (kioskId) {
        const kioskItemIds: string[] = [];
        let hasNextPage = true;
        let nextCursor: string | null = null;

        while (hasNextPage) {
          const kioskFields = await suiClient.getDynamicFields({ parentId: kioskId, cursor: nextCursor });
          kioskFields.data.forEach((field) => kioskItemIds.push(field.objectId));
          nextCursor = kioskFields.nextCursor;
          hasNextPage = kioskFields.hasNextPage;
        }

        if (kioskItemIds.length > 0) {
            const kioskItemDetails = await suiClient.multiGetObjects({
                ids: kioskItemIds,
                options: { showType: true },
            });

            kioskItemDetails.forEach((item) => {
                if (item.data?.type && WHITELISTED_TYPES.has(item.data.type)) {
                    whitelistedObjectIds.add(item.data.objectId);
                }
            });
        }
      }
    }

    if (whitelistedObjectIds.size === 0) {
      return [];
    }

    const finalIds = Array.from(whitelistedObjectIds);
    const finalObjectDetails = await suiClient.multiGetObjects({
      ids: finalIds,
      options: { showDisplay: true },
    });

    const formattedNfts = finalObjectDetails
      .filter((detail) => detail.data?.display?.data)
      .map((detail) => {
        const displayData = detail.data?.display?.data;
        return {
          id: detail.data?.objectId || "",
          name: displayData?.name || "No Name",
          imageUrl: (displayData?.image_url || "")
            .replace("ipfs://", "https://ipfs.io/ipfs/")
            .replace("ar://", "https://arweave.net/"),
        };
      });

    return formattedNfts;
  } catch (err) {
    console.error("Error fetching whitelisted NFTs:", err);
    return [];
  }
};
