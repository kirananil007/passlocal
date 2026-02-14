use crate::crypto::{generate_salt, CryptoManager};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Vault not found")]
    VaultNotFound,
    #[error("Vault already exists")]
    VaultAlreadyExists,
    #[error("Invalid password")]
    InvalidPassword,
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    #[error("Crypto error: {0}")]
    CryptoError(#[from] crate::crypto::CryptoError),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Secret {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub key: String,
    pub value: String,
    pub folder_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vault {
    pub folders: Vec<Folder>,
    pub secrets: Vec<Secret>,
    pub version: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct VaultFile {
    salt: String,
    test: String, // Encrypted known string for password verification
    data: String, // Encrypted vault JSON
}

impl Vault {
    pub fn new() -> Self {
        Self {
            folders: vec![
                Folder {
                    id: Uuid::new_v4().to_string(),
                    name: "Personal".to_string(),
                    icon: "person".to_string(),
                    order: 0,
                },
                Folder {
                    id: Uuid::new_v4().to_string(),
                    name: "Work".to_string(),
                    icon: "briefcase".to_string(),
                    order: 1,
                },
            ],
            secrets: vec![],
            version: 1,
        }
    }
}

impl Default for Vault {
    fn default() -> Self {
        Self::new()
    }
}

pub fn get_vault_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".passlocal")
}

pub fn get_vault_path() -> PathBuf {
    get_vault_dir().join("vault.enc")
}

pub fn vault_exists() -> bool {
    get_vault_path().exists()
}

pub fn create_vault(password: &str) -> Result<Vault, StorageError> {
    if vault_exists() {
        return Err(StorageError::VaultAlreadyExists);
    }

    let vault = Vault::new();
    let salt = generate_salt();
    let crypto = CryptoManager::new(password, &salt)?;

    // Encrypt a known test string for password verification
    let test = crypto.encrypt("passlocal_test")?;

    // Encrypt the vault data
    let vault_json = serde_json::to_string(&vault)?;
    let encrypted_data = crypto.encrypt(&vault_json)?;

    let vault_file = VaultFile {
        salt: BASE64.encode(salt),
        test,
        data: encrypted_data,
    };

    // Ensure directory exists
    let vault_dir = get_vault_dir();
    fs::create_dir_all(&vault_dir)?;

    // Write vault file
    let vault_path = get_vault_path();
    let file_content = serde_json::to_string_pretty(&vault_file)?;
    fs::write(vault_path, file_content)?;

    Ok(vault)
}

pub fn unlock_vault(password: &str) -> Result<Vault, StorageError> {
    let vault_path = get_vault_path();
    if !vault_path.exists() {
        return Err(StorageError::VaultNotFound);
    }

    let file_content = fs::read_to_string(vault_path)?;
    let vault_file: VaultFile = serde_json::from_str(&file_content)?;

    let salt = BASE64
        .decode(&vault_file.salt)
        .map_err(|_| StorageError::InvalidPassword)?;

    let crypto = CryptoManager::new(password, &salt)?;

    // Verify password by decrypting test string
    let test_result = crypto.decrypt(&vault_file.test);
    if test_result.is_err() || test_result.unwrap() != "passlocal_test" {
        return Err(StorageError::InvalidPassword);
    }

    // Decrypt vault data
    let vault_json = crypto.decrypt(&vault_file.data)?;
    let vault: Vault = serde_json::from_str(&vault_json)?;

    Ok(vault)
}

pub fn save_vault(vault: &Vault, password: &str) -> Result<(), StorageError> {
    let vault_path = get_vault_path();
    if !vault_path.exists() {
        return Err(StorageError::VaultNotFound);
    }

    // Read existing vault file to get salt
    let file_content = fs::read_to_string(&vault_path)?;
    let mut vault_file: VaultFile = serde_json::from_str(&file_content)?;

    let salt = BASE64
        .decode(&vault_file.salt)
        .map_err(|_| StorageError::InvalidPassword)?;

    let crypto = CryptoManager::new(password, &salt)?;

    // Encrypt updated vault data
    let vault_json = serde_json::to_string(&vault)?;
    vault_file.data = crypto.encrypt(&vault_json)?;

    // Write updated vault file
    let file_content = serde_json::to_string_pretty(&vault_file)?;
    fs::write(vault_path, file_content)?;

    Ok(())
}
