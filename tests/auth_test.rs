#[cfg(test)]
mod tests {
    use pig_nation_coins_rust_backend::User;

    #[test]
    fn test_user_creation_and_password_verification() {
        let username = "testuser".to_string();
        let password = "securepassword".to_string();

        let user = User::new(username.clone(), password.clone()).unwrap();

        assert_eq!(user.username, username);
        assert!(user.verify_password(&password));
        assert!(!user.verify_password("wrongpassword"));
    }
}


