# Data Handling & Encryption Architecture (Zero-Knowledge)

This document outlines the data model and encryption strategy for the local typing application. The system is designed to allow individual users to maintain their own isolated data files, while providing administrators a way to manage and export a unified master file. 

**Crucially, this is a Zero-Knowledge architecture: The Admin acts only as a data facilitator and cannot decrypt or read user data. Only the user can unlock their data, and if a passkey is lost, the data is unrecoverable.**

## Storage Strategy: Isolated User Files + Admin Master Archive

1. **User Files (`[username]_data.json`)**: 
   - A standalone file containing *only* that specific user's encrypted data.
   - When a user clicks "Export", they receive this file.
   - When a user wants to play, they "Import" this file (or select their profile locally) and enter their 4-digit passkey to unlock it.

2. **Admin Master File (`admin_master.json`)**:
   - A single compiled file containing the raw, **encrypted** payloads of *all* users registered on the local machine.
   - When the Admin clicks "Export All Users", the app simply bundles all the encrypted user files together into this single master file (or a `.zip` archive).
   - The Admin **cannot** decrypt this file. It is solely for backup, migration, or distribution purposes.

## Cryptography: Zero-Knowledge Envelope Encryption (Best Approach)

We use **Envelope Encryption** to allow users to securely change their 4-digit passkeys in the future without needing to re-encrypt their entire database, while strictly enforcing that only the user can access their data.

### The Keys
1. **DEK (Data Encryption Key)**: A unique, random AES-256 key generated for a user when their profile is created. The actual typing data is encrypted with this DEK.
2. **User KEK (Key Encryption Key)**: Derived from the user's 4-digit passkey combined with a unique, random salt using a strong hashing algorithm (like PBKDF2 or Argon2).

### How it Works
1. **Data Creation & File Structure**:
   - The user's typing data is encrypted using their unique **DEK**.
   - The user's `[username]_data.json` file stores the encrypted data, PLUS the **DEK** locked by their passkey:
     - `dek_encrypted_by_user`: The DEK locked by the User KEK.
     - `salt`: The random string used to derive the User KEK securely from the 4-digit passkey.

2. **User Workflow (Only their file)**:
   - User imports `alex_data.json` or selects their profile.
   - User enters their 4-digit passkey. The app combines it with the `salt` to derive the User KEK, and uses it to unlock `dek_encrypted_by_user`.
   - The app uses the unlocked DEK to decrypt the typing stats in-memory.
   - **If the passkey is forgotten, the derivation fails, the DEK cannot be unlocked, and the data is permanently unrecoverable.**

3. **Admin Workflow (Master file)**:
   - Admin logs in (via their own Admin password).
   - Admin clicks "Export All Data". 
   - The app gathers all local `[username]_data.json` files and packages them into `admin_master.json`. 
   - The Admin has no cryptographic mechanism to unlock `dek_encrypted_by_user`, ensuring absolute privacy for the users.

## Why This Architecture is Robust
- **Zero-Knowledge Privacy**: Users have cryptographic guarantees that not even the Admin can read their typing history.
- **Zero Additional Setup**: The cryptography runs entirely using native Web Crypto APIs in the browser. No external database servers are required.
- **Passkey Changes**: If a user wants to change their 4-digit PIN, the app only needs to re-encrypt the tiny **DEK** with the new PIN. It does *not* need to decrypt and re-encrypt the entire database of typing stats.
- **Future-Proof**: The underlying data schema is just a standard JSON object. If the app ever scales to a cloud backend, the encrypted blobs map perfectly to Document databases without needing restructuring.

## Schema Examples

### 1. User File (`alex_data.json`)
```json
{
  "username": "Alex",
  "salt": "random_crypto_salt_string",
  "dek_encrypted_by_user": "base64_string_of_dek...",
  "encrypted_payload": "base64_string_of_actual_data..."
}
```

### 2. Admin Master File (`admin_master.json`)
```json
{
  "export_date": "2024-01-01T12:00:00Z",
  "users": [
    {
      "username": "Alex",
      "salt": "random_crypto_salt_string_1",
      "dek_encrypted_by_user": "...",
      "encrypted_payload": "..."
    },
    {
      "username": "Sarah",
      "salt": "random_crypto_salt_string_2",
      "dek_encrypted_by_user": "...",
      "encrypted_payload": "..."
    }
  ]
}
```
