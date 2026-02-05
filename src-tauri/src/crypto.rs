use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::{rngs::OsRng, RngCore};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed")]
    EncryptionFailed,
    #[error("Decryption failed")]
    DecryptionFailed,
    #[error("Key derivation failed")]
    KeyDerivationFailed,
    #[error("Invalid data format")]
    InvalidFormat,
}

pub struct CryptoManager {
    key: [u8; 32],
}

impl CryptoManager {
    pub fn new(password: &str, salt: &[u8]) -> Result<Self, CryptoError> {
        let key = derive_key(password, salt)?;
        Ok(Self { key })
    }

    pub fn encrypt(&self, plaintext: &str) -> Result<String, CryptoError> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|_| CryptoError::EncryptionFailed)?;

        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|_| CryptoError::EncryptionFailed)?;

        // Combine nonce + ciphertext and encode as base64
        let mut combined = nonce_bytes.to_vec();
        combined.extend(ciphertext);

        Ok(BASE64.encode(combined))
    }

    pub fn decrypt(&self, encrypted: &str) -> Result<String, CryptoError> {
        let combined = BASE64
            .decode(encrypted)
            .map_err(|_| CryptoError::InvalidFormat)?;

        if combined.len() < 12 {
            return Err(CryptoError::InvalidFormat);
        }

        let (nonce_bytes, ciphertext) = combined.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|_| CryptoError::DecryptionFailed)?;

        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|_| CryptoError::DecryptionFailed)?;

        String::from_utf8(plaintext).map_err(|_| CryptoError::DecryptionFailed)
    }
}

fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], CryptoError> {
    let salt_string = SaltString::encode_b64(salt)
        .map_err(|_| CryptoError::KeyDerivationFailed)?;

    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt_string)
        .map_err(|_| CryptoError::KeyDerivationFailed)?;

    let hash_bytes = hash.hash.ok_or(CryptoError::KeyDerivationFailed)?;
    let bytes = hash_bytes.as_bytes();

    let mut key = [0u8; 32];
    key.copy_from_slice(&bytes[..32]);
    Ok(key)
}

pub fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    salt
}

pub fn verify_password(password: &str, salt: &[u8], encrypted_test: &str) -> bool {
    match CryptoManager::new(password, salt) {
        Ok(crypto) => crypto.decrypt(encrypted_test).is_ok(),
        Err(_) => false,
    }
}
