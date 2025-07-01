use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemSettings {
    pub theme: String,
    pub language: String,
    pub notifications_enabled: bool,
}

impl SystemSettings {
    pub fn new(theme: String, language: String, notifications_enabled: bool) -> Self {
        SystemSettings {
            theme,
            language,
            notifications_enabled,
        }
    }
}

pub struct SystemSettingsManager {
    settings: SystemSettings,
}

impl SystemSettingsManager {
    pub fn new() -> Self {
        SystemSettingsManager {
            settings: SystemSettings::new(
                "dark".to_string(),
                "en".to_string(),
                true,
            ),
        }
    }

    pub fn get_settings(&self) -> &SystemSettings {
        &self.settings
    }

    pub fn update_theme(&mut self, theme: String) {
        self.settings.theme = theme;
    }

    pub fn update_language(&mut self, language: String) {
        self.settings.language = language;
    }

    pub fn set_notifications_enabled(&mut self, enabled: bool) {
        self.settings.notifications_enabled = enabled;
    }
}


