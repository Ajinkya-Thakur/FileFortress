# FileFortress - Current Phase: Authentication System

## Authentication Flow Diagram

1. Registration Flow:
```
Frontend                              Backend
   |                                    |
   |------ Registration Form Data ----->|
   |     (email, password, name)        | - Validates data
   |                                    | - Generates MFA secret
   |                                    | - Stores in session
   |<----- QR Code + Secret -----------|
   |                                    |
   |------ MFA Code ------------------>| 
   |                                    | - Verifies MFA code
   |                                    | - Creates user if valid
   |<----- Success/Error --------------|
   |                                    |
```

2. Login Flow:
```
Frontend                              Backend
   |                                    |
   |------ Login Credentials --------->|
   |     (email, password)              | - Validates credentials
   |                                    | 
   |<----- User ID + MFA Required -----|
   |                                    |
   |------ MFA Code + User ID -------->| 
   |                                    | - Verifies MFA code
   |<----- JWT Tokens + User Data -----|
   |                                    |
```

## Key Features Implemented:
1. Mandatory MFA for all users
2. Session-based registration process
3. JWT-based authentication
4. TOTP (Time-based One-Time Password) for MFA
5. QR code generation for authenticator apps

## Security Measures:
- No user creation until MFA setup is complete
- No token issuance without MFA verification
- Secure session handling
- Password validation
- Email verification
- Rate limiting on authentication endpoints

## Next Phase:
- File encryption system
- Secure file storage
- File sharing mechanism
- Access control implementation 