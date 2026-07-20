import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Replace firstAsset logic with a state
old_asset_logic = """  const activeAssets = assets?.filter(a => a.status === 'active') || [];
  const firstAsset = activeAssets[0];"""

new_asset_logic = """  const activeAssets = assets?.filter(a => a.status === 'active') || [];
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (activeAssets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(activeAssets[0].id);
    }
  }, [activeAssets, selectedAssetId]);

  const activeAsset = activeAssets.find(a => a.id === selectedAssetId) || activeAssets[0];"""

content = content.replace(old_asset_logic, new_asset_logic)

# Update firstAsset references to activeAsset
content = content.replace('firstAsset!', 'activeAsset!')
content = content.replace('firstAsset?', 'activeAsset?')
content = content.replace('firstAsset.', 'activeAsset.')
content = content.replace('firstAsset ', 'activeAsset ')

# Add onClick handler to the asset selection list
list_item_start = """<div key={asset.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-neutral)', cursor: 'pointer', backgroundColor: activeAsset?.id === asset.id ? 'rgba(118,185,0,0.1)' : 'transparent', borderLeft: activeAsset?.id === asset.id ? '4px solid var(--color-primary)' : '4px solid transparent', transition: 'all 0.2s' }}>"""
list_item_replacement = """<div key={asset.id} onClick={() => setSelectedAssetId(asset.id)} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-neutral)', cursor: 'pointer', backgroundColor: activeAsset?.id === asset.id ? 'rgba(118,185,0,0.1)' : 'transparent', borderLeft: activeAsset?.id === asset.id ? '4px solid var(--color-primary)' : '4px solid transparent', transition: 'all 0.2s' }}>"""
content = content.replace(list_item_start, list_item_replacement)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

print("Dashboard interactivity patched successfully!")
