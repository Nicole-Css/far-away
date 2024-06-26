import { FrameRequest } from "@coinbase/onchainkit";
import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";
import { getSSLHubRpcClient, Message } from '@farcaster/hub-nodejs';

export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL|| 'https://far-away-beta.vercel.app/';
const ID_REGISTRY_CONTRACT_ADDRESS: `0x${string}` = '0x00000000fc6c5f01fc30151999387bb99a9f489b'; // Optimism Mainnet
const ZERO_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000';
const HUB_URL = 'nemes.farcaster.xyz:2283';

export enum FrameImageUrls {
    START = 'https://privy-frames-demo.vercel.app/landing.png',
    WALLET = 'https://privy-frames-demo.vercel.app/wallet.png',
    SUCCESS = 'https://privy-frames-demo.vercel.app/success.png',
    ERROR = 'https://white-live-termite-961.mypinata.cloud/ipfs/QmXRWMHFyvQ6P85j9KCkDXgrsskvWwcvvpj6aBLPytWkvk'
}

export const createFrame = (imageUrl: string, buttonText: string, apiPath: string, isRedirect = false) => {
    return (`
        <!DOCTYPE html>
        <html>
            <head>
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${imageUrl}">
            <meta name="fc:frame:post_url" content="${NEXT_PUBLIC_BASE_URL}/${apiPath}">
            <meta name="fc:frame:button:1" content="${buttonText}">
            <meta name="fc:frame:button:1:action" content="${isRedirect ? 'post_redirect' : 'post'}">
            </head>
        </html>`);
}
export const successFrame = (address: string) => {
    return createFrame(address, 'Done', 'api/done', true);
}
export const errorFrame = createFrame(FrameImageUrls.ERROR, 'Try again?', 'api/frame');

export const parseFrameRequest = async (request: FrameRequest) => {
    const hub = getSSLHubRpcClient(HUB_URL);
    let fid: number | undefined;
    let isValid: boolean = true;

    try {
        const decodedMessage = Message.decode(
            Buffer.from(request.trustedData.messageBytes, "hex")
        );
        const result = await hub.validateMessage(decodedMessage);
        if (!result.isOk() || !result.value.valid || !result.value.message) {
            isValid = false;
        } else {
            fid = result.value.message.data?.fid;
        }
    } catch (error) {
        console.error(error)
    }

    return {fid: fid, isValid: isValid};
}

export const getOwnerAddressFromFid = async (fid: number) => {
    let ownerAddress: `0x${string}` | undefined;
    try {
        const publicClient = createPublicClient({
            chain: optimism,
            transport: http(),
        });
        const idRegistry = getContract({
            address: ID_REGISTRY_CONTRACT_ADDRESS,
            abi: [
              {
                inputs: [{internalType: 'uint256', name: 'fid', type: 'uint256'}],
                name: 'custodyOf',
                outputs: [{internalType: 'address', name: 'owner', type: 'address'}],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            client: publicClient
        });
        ownerAddress = await idRegistry.read.custodyOf([BigInt(fid)]);
    } catch (error) {
        console.error(error);
    }
    return ownerAddress !== ZERO_ADDRESS ? ownerAddress : undefined;
}
