# Pig Nation Coins Rust Backend

This project implements a secure and modular backend for a financial application using Rust, addressing the issues outlined in [GitHub Issue #2](https://github.com/quiettimejsg/pig-nation-coins/issues/2).

## Project Structure

```
pig-nation-coins-rust-backend/
├── src/
│   ├── main.rs             # Main application entry point and examples
│   ├── lib.rs              # Library declarations for modules
│   ├── api_service.rs      # API interaction module
│   ├── jwt_manager.rs      # JWT token creation and decoding
│   ├── user_manager.rs     # User profile management
│   ├── transaction_manager.rs # Transaction management
│   └── system_settings_manager.rs # System settings management
├── tests/                  # Integration tests
│   └── auth_test.rs        # Authentication module tests
├── Cargo.toml              # Project dependencies and metadata
├── Cargo.lock              # Exact dependency versions
└── README.md               # This file
```

## Modules Implemented

1.  **Authentication Module (`src/lib.rs` and `src/main.rs` for `User` and `AuthError`)**:
    *   Handles user creation with secure password hashing using Argon2.
    *   Provides password verification functionality.

2.  **API Service Module (`src/api_service.rs`)**:
    *   Provides a basic asynchronous HTTP client for fetching data from external URLs using `reqwest`.

3.  **JWT Manager Module (`src/jwt_manager.rs`)**:
    *   Enables creation and decoding of JSON Web Tokens (JWT) for secure authentication.
    *   Uses HS512 algorithm for signing and verification.

4.  **User Manager Module (`src/user_manager.rs`)**:
    *   Manages user profiles, including adding, retrieving, and updating user information.

5.  **Transaction Manager Module (`src/transaction_manager.rs`)**:
    *   Handles financial transactions, allowing adding, retrieving by user, and retrieving by transaction ID.

6.  **System Settings Manager Module (`src/system_settings_manager.rs`)**:
    *   Manages application-wide settings such as theme, language, and notification preferences.

## Getting Started

### Prerequisites

*   [Rust](https://www.rust-lang.org/tools/install) (latest stable version recommended)

### Building and Running

1.  **Clone the repository (if not already cloned):**
    ```bash
    git clone <repository_url>
    cd pig-nation-coins-rust-backend
    ```

2.  **Build the project:**
    ```bash
    cargo build
    ```

3.  **Run the example application:**
    ```bash
    cargo run
    ```
    This will execute the `main.rs` file, demonstrating the basic functionalities of each implemented module.

### Running Tests

To run the unit and integration tests:

```bash
cargo test
```

## Version Control and Contributions

This project uses Git for version control. Features are developed on separate branches and merged into `main` after testing. Frequent commits are made to ensure progress is saved and changes are easily reviewable.

## Future Enhancements

*   Implement real backend integration for API calls.
*   Add database persistence for users, transactions, and settings.
*   Develop a comprehensive error handling strategy for all modules.
*   Implement a robust logging system.
*   Integrate with a CI/CD pipeline for automated testing and deployment.
*   Expand internationalization support.
*   Implement QR code login with WebSocket for real-time updates.



