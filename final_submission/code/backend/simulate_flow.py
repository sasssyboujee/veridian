import requests
import json
import uuid
import sys
from datetime import datetime, timedelta

# Add backend directory to path to import app services
sys.path.append(".")
from app.services.tpm_verify import generate_dev_keypair, sign_payload

BASE_URL = "http://127.0.0.1:8000"

print("🚀 Starting End-to-End Simulation")

# Helper to assert response codes
def check_response(res, step_name):
    print(f"{step_name}: {res.status_code}")
    if res.status_code not in (200, 201, 204):
        print(f"❌ Error in {step_name}: {res.text}")
        sys.exit(1)
    return res.json() if res.status_code != 204 else None

# 1. Create an Asset
asset_payload = {
    "name": "Solar Plant Alpha",
    "spv_entity": "Solar SPV LLC",
    "jurisdiction": "US",
    "asset_type": "equipment"
}
res = requests.post(f"{BASE_URL}/assets", json=asset_payload)
asset = check_response(res, "Asset Creation")
asset_id = asset["id"]
print(f"✅ Created Asset: {asset_id}")

# 2. Activate the Asset (by default status is pending, we need active to ingest telemetry)
patch_payload = {
    "status": "active"
}
res = requests.patch(f"{BASE_URL}/assets/{asset_id}", json=patch_payload)
check_response(res, "Asset Activation")
print("✅ Activated Asset")

# 3. Create a Billing Cycle (Ending in the future so that our telemetry falls inside the window)
period_start = datetime.utcnow() - timedelta(days=30)
period_end = datetime.utcnow() + timedelta(minutes=5)
cycle_payload = {
    "asset_id": asset_id,
    "period_start": period_start.isoformat(),
    "period_end": period_end.isoformat()
}
res = requests.post(f"{BASE_URL}/yields/cycles", json=cycle_payload)
cycle = check_response(res, "Billing Cycle Creation")
cycle_id = cycle["id"]
print(f"✅ Created Billing Cycle: {cycle_id}")

# 4. Generate TPM Signature and Send Telemetry Data
# Create the raw payload dict
raw_payload = {
    "asset_id": asset_id,
    "operating_hours": 720.50,
    "utilization_rate": 0.9500,
    "physical_audit_hours": 650.00 # > 10% variance to trigger SLA slash
}

# Generate keypair and sign
private_pem, public_pem = generate_dev_keypair()
signature_hex = sign_payload(raw_payload, private_pem)

telemetry_payload = {
    "asset_id": asset_id,
    "operating_hours": 720.50,
    "utilization_rate": 0.9500,
    "physical_audit_hours": 650.00,
    "tpm_signature": signature_hex,
    "tpm_public_key": public_pem,
    "raw_payload": raw_payload
}

res = requests.post(f"{BASE_URL}/telemetry", json=telemetry_payload)
check_response(res, "Telemetry Ingestion")
print(f"✅ Ingested Telemetry Data (Variance simulated)")

# Check Asset SLA Status
res = requests.get(f"{BASE_URL}/assets/{asset_id}")
updated_asset = check_response(res, "Asset Fetch")
print(f"📊 Operator Stake Balance: {updated_asset['operator_stake_balance']}")
print(f"🚨 Stake Slashed: {updated_asset['stake_slashed']}")

# 5. Trigger Yield Calculation
res = requests.post(f"{BASE_URL}/yields/calculate/{cycle_id}")
yield_calc = check_response(res, "Yield Calculation")
print(f"✅ Calculated Yield: {json.dumps(yield_calc, indent=2)}")

# 6. Fetch Oracle Payload
res = requests.get(f"{BASE_URL}/yields/oracle/{asset_id}?api_key=dev-oracle-key-123")
oracle_payload = check_response(res, "Oracle Yield Fetch")
print(f"✅ Oracle Payload Ready: {json.dumps(oracle_payload, indent=2)}")

print("🎉 End-to-End API Flow Simulation Successful!")
