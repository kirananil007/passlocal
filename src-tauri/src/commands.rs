use crate::storage::{self, Folder, Secret, StorageError, Vault};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use uuid::Uuid;

pub struct AppState {
    pub vault: Mutex<Option<Vault>>,
    pub password: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            vault: Mutex::new(None),
            password: Mutex::new(None),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultStatus {
    pub exists: bool,
    pub unlocked: bool,
}

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<StorageError> for CommandError {
    fn from(err: StorageError) -> Self {
        CommandError {
            message: err.to_string(),
        }
    }
}

// Check if vault exists and is unlocked
#[tauri::command]
pub fn get_vault_status(state: tauri::State<AppState>) -> VaultStatus {
    let vault = state.vault.lock().unwrap();
    VaultStatus {
        exists: storage::vault_exists(),
        unlocked: vault.is_some(),
    }
}

// Create new vault with master password
#[tauri::command]
pub fn setup_vault(
    password: String,
    state: tauri::State<AppState>,
) -> Result<Vault, CommandError> {
    let vault = storage::create_vault(&password)?;

    *state.vault.lock().unwrap() = Some(vault.clone());
    *state.password.lock().unwrap() = Some(password);

    Ok(vault)
}

// Unlock existing vault
#[tauri::command]
pub fn unlock_vault(
    password: String,
    state: tauri::State<AppState>,
) -> Result<Vault, CommandError> {
    let vault = storage::unlock_vault(&password)?;

    *state.vault.lock().unwrap() = Some(vault.clone());
    *state.password.lock().unwrap() = Some(password);

    Ok(vault)
}

// Lock vault (clear from memory)
#[tauri::command]
pub fn lock_vault(state: tauri::State<AppState>) -> Result<(), CommandError> {
    *state.vault.lock().unwrap() = None;
    *state.password.lock().unwrap() = None;
    Ok(())
}

// Get current vault data
#[tauri::command]
pub fn get_vault(state: tauri::State<AppState>) -> Result<Vault, CommandError> {
    let vault = state.vault.lock().unwrap();
    vault.clone().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })
}

// Add a new folder
#[tauri::command]
pub fn add_folder(
    name: String,
    icon: String,
    state: tauri::State<AppState>,
) -> Result<Folder, CommandError> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })?;

    let order = vault.folders.len() as i32;
    let folder = Folder {
        id: Uuid::new_v4().to_string(),
        name,
        icon,
        order,
    };

    vault.folders.push(folder.clone());

    // Save vault
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or(CommandError {
        message: "No password available".to_string(),
    })?;
    storage::save_vault(vault, password)?;

    Ok(folder)
}

// Update a folder
#[tauri::command]
pub fn update_folder(
    id: String,
    name: String,
    icon: String,
    state: tauri::State<AppState>,
) -> Result<Folder, CommandError> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })?;

    let folder = vault
        .folders
        .iter_mut()
        .find(|f| f.id == id)
        .ok_or(CommandError {
            message: "Folder not found".to_string(),
        })?;

    folder.name = name;
    folder.icon = icon;
    let updated_folder = folder.clone();

    // Save vault
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or(CommandError {
        message: "No password available".to_string(),
    })?;
    storage::save_vault(vault, password)?;

    Ok(updated_folder)
}

// Delete a folder (moves secrets to first folder or deletes them)
#[tauri::command]
pub fn delete_folder(id: String, state: tauri::State<AppState>) -> Result<(), CommandError> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })?;

    // Don't allow deleting the last folder
    if vault.folders.len() <= 1 {
        return Err(CommandError {
            message: "Cannot delete the last folder".to_string(),
        });
    }

    // Find a folder to move secrets to
    let fallback_folder_id = vault
        .folders
        .iter()
        .find(|f| f.id != id)
        .map(|f| f.id.clone())
        .ok_or(CommandError {
            message: "No fallback folder found".to_string(),
        })?;

    // Move secrets to fallback folder
    for secret in vault.secrets.iter_mut() {
        if secret.folder_id == id {
            secret.folder_id = fallback_folder_id.clone();
        }
    }

    // Remove the folder
    vault.folders.retain(|f| f.id != id);

    // Reorder remaining folders
    for (i, folder) in vault.folders.iter_mut().enumerate() {
        folder.order = i as i32;
    }

    // Save vault
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or(CommandError {
        message: "No password available".to_string(),
    })?;
    storage::save_vault(vault, password)?;

    Ok(())
}

// Add a new secret
#[tauri::command]
pub fn add_secret(
    name: String,
    key: String,
    value: String,
    notes: String,
    folder_id: String,
    state: tauri::State<AppState>,
) -> Result<Secret, CommandError> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })?;

    // Verify folder exists
    if !vault.folders.iter().any(|f| f.id == folder_id) {
        return Err(CommandError {
            message: "Folder not found".to_string(),
        });
    }

    let now = Utc::now();
    let secret = Secret {
        id: Uuid::new_v4().to_string(),
        name,
        key,
        value,
        notes,
        folder_id,
        created_at: now,
        updated_at: now,
    };

    vault.secrets.push(secret.clone());

    // Save vault
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or(CommandError {
        message: "No password available".to_string(),
    })?;
    storage::save_vault(vault, password)?;

    Ok(secret)
}

// Update a secret
#[tauri::command]
pub fn update_secret(
    id: String,
    name: String,
    key: String,
    value: String,
    notes: String,
    folder_id: String,
    state: tauri::State<AppState>,
) -> Result<Secret, CommandError> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })?;

    let secret = vault
        .secrets
        .iter_mut()
        .find(|s| s.id == id)
        .ok_or(CommandError {
            message: "Secret not found".to_string(),
        })?;

    secret.name = name;
    secret.key = key;
    secret.value = value;
    secret.notes = notes;
    secret.folder_id = folder_id;
    secret.updated_at = Utc::now();
    let updated_secret = secret.clone();

    // Save vault
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or(CommandError {
        message: "No password available".to_string(),
    })?;
    storage::save_vault(vault, password)?;

    Ok(updated_secret)
}

// Delete a secret
#[tauri::command]
pub fn delete_secret(id: String, state: tauri::State<AppState>) -> Result<(), CommandError> {
    let mut vault_guard = state.vault.lock().unwrap();
    let vault = vault_guard.as_mut().ok_or(CommandError {
        message: "Vault is locked".to_string(),
    })?;

    vault.secrets.retain(|s| s.id != id);

    // Save vault
    let password_guard = state.password.lock().unwrap();
    let password = password_guard.as_ref().ok_or(CommandError {
        message: "No password available".to_string(),
    })?;
    storage::save_vault(vault, password)?;

    Ok(())
}
