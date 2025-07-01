use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{PasswordHash, SaltString};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;

mod api_service;
mod jwt_manager;
mod user_manager;
mod transaction_manager;
mod system_settings_manager;

#[derive(Debug)]
pub enum AuthError {
    PasswordHashError(argon2::password_hash::Error),
    Other(String),
    JwtError(jsonwebtoken::errors::Error),
}

impl fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AuthError::PasswordHashError(e) => write!(f, "Password hashing error: {}", e),
            AuthError::Other(msg) => write!(f, "Authentication error: {}", msg),
            AuthError::JwtError(e) => write!(f, "JWT error: {}", e),
        }
    }
}

impl Error for AuthError {}

impl From<argon2::password_hash::Error> for AuthError {
    fn from(err: argon2::password_hash::Error) -> Self {
        AuthError::PasswordHashError(err)
    }
}

impl From<jsonwebtoken::errors::Error> for AuthError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AuthError::JwtError(err)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub username: String,
    pub password_hash: String,
}

impl User {
    pub fn new(username: String, password: String) -> Result<Self, AuthError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();

        Ok(User {
            username,
            password_hash,
        })
    }

    pub fn verify_password(&self, password: &str) -> bool {
        let parsed_hash = PasswordHash::new(&self.password_hash).unwrap();
        Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok()
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("Authentication module initialized.");

    // Example usage of API service
    let url = "https://www.rust-lang.org/";
    match api_service::fetch_data(url).await {
        Ok(data) => println!("Fetched data from {}: {}...", url, &data[..50]),
        Err(e) => eprintln!("Error fetching data from {}: {}", url, e),
    }

    // Example usage of JWT manager
    let secret = b"super_secret_key";
    let username = "testuser";
    match jwt_manager::create_jwt(username, secret) {
        Ok(token) => {
            println!("Generated JWT: {}", token);
            match jwt_manager::decode_jwt(&token, secret) {
                Ok(claims) => println!("Decoded JWT claims: {:?}", claims),
                Err(e) => eprintln!("Error decoding JWT: {}", e),
            }
        }
        Err(e) => eprintln!("Error creating JWT: {}", e),
    }

    // Example usage of User Manager
    let mut user_manager = user_manager::UserManager::new();
    let user1 = user_manager::UserProfile::new(
        "alice".to_string(),
        "alice@example.com".to_string(),
        None,
    );
    user_manager.add_user(user1);

    if let Some(user) = user_manager.get_user_by_username("alice") {
        println!("Found user: {:?}", user);
    }

    let updated_user = user_manager::UserProfile::new(
        "alice".to_string(),
        "alice_new@example.com".to_string(),
        Some("123-456-7890".to_string()),
    );
    if let Some(old_user) = user_manager.update_user_profile("alice", updated_user) {
        println!("Updated user. Old profile: {:?}", old_user);
    }

    // Example usage of Transaction Manager
    let mut transaction_manager = transaction_manager::TransactionManager::new();
    let transaction1 = transaction_manager::Transaction::new(
        "txn_001".to_string(),
        "alice".to_string(),
        100.0,
        "USD".to_string(),
        "deposit".to_string(),
        Some("Initial deposit".to_string()),
    );
    transaction_manager.add_transaction(transaction1);

    let transaction2 = transaction_manager::Transaction::new(
        "txn_002".to_string(),
        "alice".to_string(),
        -50.0,
        "USD".to_string(),
        "withdrawal".to_string(),
        None,
    );
    transaction_manager.add_transaction(transaction2);

    if let Some(txn) = transaction_manager.get_transaction_by_id("txn_001") {
        println!("Found transaction: {:?}", txn);
    }

    let alice_txns = transaction_manager.get_transactions_by_user("alice");
    println!("Alice's transactions: {:?}", alice_txns);

    // Example usage of System Settings Manager
    let mut settings_manager = system_settings_manager::SystemSettingsManager::new();
    println!("Initial settings: {:?}", settings_manager.get_settings());

    settings_manager.update_theme("light".to_string());
    settings_manager.update_language("zh".to_string());
    settings_manager.set_notifications_enabled(false);
    println!("Updated settings: {:?}", settings_manager.get_settings());

    Ok(())
}


