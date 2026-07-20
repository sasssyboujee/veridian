import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { RWAFactory_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { OnChainAsset } from '@/types/asset';

export function useDeployedAssets() {
  const { data: deployedAssets, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.RWAFactory as `0x${string}`,
    abi: RWAFactory_ABI,
    functionName: 'getAllAssetsData',
  });

  const assets: OnChainAsset[] = useMemo(() => {
    if (!deployedAssets) return [];
    
    // The contract returns an array of tuples struct RWAFactory.AssetData[]
    return (deployedAssets as unknown as {
      tokenAddress: string;
      name: string;
      symbol: string;
      governorAddress: string;
      poolAddress: string;
    }[]).map((asset) => ({
      address: asset.tokenAddress,
      name: asset.name,
      symbol: asset.symbol,
      governorAddress: asset.governorAddress,
      poolAddress: asset.poolAddress,
    }));
  }, [deployedAssets]);

  return {
    assets,
    isLoading,
    error,
    refetch,
  };
}
