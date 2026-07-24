"""TPM 2.0 / Secure Enclave signature verification service.

Verifies that telemetry payloads are cryptographically signed by
a Hardware Root of Trust embedded in the physical asset.
"""

import hashlib
import json
import logging
from typing import Optional

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, utils
from cryptography.exceptions import InvalidSignature

logger = logging.getLogger(__name__)


def verify_tpm_signature(
    raw_payload: dict,
    signature_hex: str,
    public_key_pem: Optional[str] = None,
) -> bool:
    """
    Verify an ECDSA signature from a TPM 2.0 / Secure Enclave.

    Args:
        raw_payload: The original telemetry data dict.
        signature_hex: Hex-encoded ECDSA signature (DER format).
        public_key_pem: PEM-encoded EC public key.

    Returns:
        True if the signature is valid, False otherwise.
    """
    if not signature_hex:
        logger.warning("Empty TPM signature received")
        return False

    if not public_key_pem:
        logger.error("No TPM public key provided")
        return False

    # Timestamp verification
    timestamp_str = raw_payload.get("timestamp")
    if not timestamp_str:
        logger.error("Missing timestamp in payload")
        return False
        
    try:
        from datetime import datetime, timezone
        payload_time = datetime.fromisoformat(timestamp_str)
        if not payload_time.tzinfo:
            payload_time = payload_time.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if abs((now - payload_time).total_seconds()) > 300:
            logger.error("Payload timestamp drift exceeds 5 minutes")
            return False
    except ValueError:
        logger.error("Invalid timestamp format")
        return False

    # Canonical JSON serialization for deterministic hashing
    payload_bytes = json.dumps(raw_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    payload_hash = hashlib.sha256(payload_bytes).digest()

    try:
        # Load the EC public key
        public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))

        if not isinstance(public_key, ec.EllipticCurvePublicKey):
            logger.error("Provided key is not an EC key")
            return False

        # Verify ECDSA signature
        signature_bytes = bytes.fromhex(signature_hex)
        public_key.verify(
            signature_bytes,
            payload_hash,
            ec.ECDSA(utils.Prehashed(hashes.SHA256())),
        )
        logger.info("TPM signature verification successful")
        return True

    except (InvalidSignature, ValueError) as e:
        logger.warning(f"TPM signature verification failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during TPM verification: {e}")
        return False


def generate_dev_keypair() -> tuple[str, str]:
    """
    Generate a development EC keypair for testing TPM signature flows.

    Returns:
        Tuple of (private_key_pem, public_key_pem).
    """
    private_key = ec.generate_private_key(ec.SECP256R1())

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    return private_pem, public_pem


def sign_payload(raw_payload: dict, private_key_pem: str) -> str:
    """
    Sign a payload with an EC private key (for testing).

    Args:
        raw_payload: The telemetry data dict.
        private_key_pem: PEM-encoded EC private key.

    Returns:
        Hex-encoded ECDSA signature.
    """
    payload_bytes = json.dumps(raw_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    payload_hash = hashlib.sha256(payload_bytes).digest()

    private_key = serialization.load_pem_private_key(
        private_key_pem.encode("utf-8"),
        password=None,
    )

    signature = private_key.sign(
        payload_hash,
        ec.ECDSA(utils.Prehashed(hashes.SHA256())),
    )

    return signature.hex()
