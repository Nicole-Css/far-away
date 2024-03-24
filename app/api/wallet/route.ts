//@ts-nocheck
import { errorFrame, parseFrameRequest, getOwnerAddressFromFid, successFrame } from '@/lib/farcaster';
import { FrameRequest } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { createOrFindEmbeddedWalletForFid, createEmbeddedWallet } from '@/lib/embedded-wallet';
import { ChainEnum } from "@dynamic-labs/sdk-api/models/ChainEnum";
import { UserResponse } from "@dynamic-labs/sdk-api/models/UserResponse";
import { generate } from 'text-to-image';

export async function POST(req: NextRequest): Promise<Response> {
    let frameRequest: FrameRequest | undefined;
    let newWallets: any[] | undefined;

    // Parse and validate request from Frame for fid
    try {
        frameRequest = await req.json();
        console.log('fist',frameRequest)
        if (!frameRequest) throw new Error('Could not deserialize request from frame');
    } catch {
        return new NextResponse(errorFrame);
    }
    const {fid, isValid} = await parseFrameRequest(frameRequest);
    if (!fid || !isValid) return new NextResponse(errorFrame);
    const inputText = frameRequest.untrustedData.inputText;
    const isValidEmail = frameRequest.untrustedData.inputText
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputText)
    : false;

    // Query FC Registry contract to get owner address from fid
    const ownerAddress = await getOwnerAddressFromFid(fid);
    if (!ownerAddress) return new NextResponse(errorFrame);
    
    const embeddedWalletAddress = await createOrFindEmbeddedWalletForFid(fid, ownerAddress);
    if (!embeddedWalletAddress) return new NextResponse(errorFrame);
    
    // Generate an embedded wallet associated with the fid
    if (isValidEmail && fid) {
    try {
      newWallets = await createEmbeddedWallet(inputText, fid, [
         ChainEnum.Evm
       ]);
     } catch (e) {
        console.log('errorsquared', e);
       return new NextResponse(errorFrame);
     }
   }
    const walletD = await String(newWallets[0]) || 'lo';
    const walletP = await String(embeddedWalletAddress!) || 'glop';
    const urlimgs = await generate('Dynamic ETH Wallet: ' + walletD + ' and Privy ETH Wallet: ' + walletP )
    
    console.log('yes', urlimgs );

    return new NextResponse(successFrame(urlimgs));
}

export const dynamic = 'force-dynamic';
