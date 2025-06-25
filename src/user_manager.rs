use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserProfile {
    pub username: String,
    pub email: String,
    pub phone: Option<String>,
}

impl UserProfile {
    pub fn new(username: String, email: String, phone: Option<String>) -> Self {
        UserProfile {
            username,
            email,
            phone,
        }
    }
}

pub struct UserManager {
    users: Vec<UserProfile>,
}

impl UserManager {
    pub fn new() -> Self {
        UserManager {
            users: Vec::new(),
        }
    }

    pub fn add_user(&mut self, user: UserProfile) {
        self.users.push(user);
    }

    pub fn get_user_by_username(&self, username: &str) -> Option<&UserProfile> {
        self.users.iter().find(|u| u.username == username)
    }

    pub fn update_user_profile(&mut self, username: &str, new_profile: UserProfile) -> Option<UserProfile> {
        if let Some(pos) = self.users.iter().position(|u| u.username == username) {
            let old_profile = self.users.remove(pos);
            self.users.insert(pos, new_profile);
            Some(old_profile)
        } else {
            None
        }
    }
}


