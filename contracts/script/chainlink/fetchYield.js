// Chainlink Functions source script
// This script is executed by the Chainlink DON to fetch yield data

const assetId = args[0];
const apiEndpoint = `http://rwa-backend-url.example/yields/oracle/${assetId}`;

console.log(`Fetching yield data for asset: ${assetId}`);

const apiRequest = Functions.makeHttpRequest({
  url: apiEndpoint,
  method: "GET",
  headers: {
    "Accept": "application/json"
    // "Authorization": `Bearer ${secrets.apiKey}` // Optional depending on auth
  }
});

const apiResponse = await apiRequest;
if (apiResponse.error) {
  console.error("API Error", apiResponse.error);
  throw Error("Request failed");
}

const data = apiResponse.data;
console.log("Yield data received:", JSON.stringify(data));

// Expected JSON structure:
// {
//   "asset_id": "uuid",
//   "net_yield_wei": "1000000000000000000",
//   "token_snapshot": {
//      "0x123...": "500",
//      "0xabc...": "500"
//   }
// }

// For this example, we'll encode just the total yield and a fixed list of holders/amounts.
// In a real implementation, you'd iterate the token_snapshot to generate arrays.
const netYieldWei = BigInt(data.net_yield_wei);

const holders = Object.keys(data.token_snapshot);
// Amounts are assumed to be strings representing exact token payouts for each holder
const amounts = holders.map(h => BigInt(data.token_snapshot[h]));

// Encode for EVM: (uint256,address[],uint256[])
const encodedPayload = Functions.encodeABI(
  ["uint256", "address[]", "uint256[]"],
  [netYieldWei, holders, amounts]
);

return Functions.encodeBytes(encodedPayload);
