import pyotp
from django.conf import settings
import qrcode
import io
import base64
from io import BytesIO
import time

class AuthService:
    @staticmethod
    def generate_mfa_secret():
        """Generate a new TOTP secret"""
        return pyotp.random_base32()

    @staticmethod
    def get_totp_uri(user):
        """Generate TOTP URI for QR code"""
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.provisioning_uri(
            name=user.email,
            issuer_name="FileFortress"
        )

    @staticmethod
    def verify_mfa_token(user, token):
        """Verify a TOTP token"""
        try:
            print("\n=== MFA Token Verification ===")
            print(f"User Email: {user.email}")
            print(f"Secret: {user.mfa_secret}")
            print(f"Token to verify: {token}")
            
            totp = pyotp.TOTP(user.mfa_secret)
            
            # Get current time and expected token
            current_time = int(time.time())
            expected_token = totp.now()
            print(f"Current timestamp: {current_time}")
            print(f"Expected token: {expected_token}")
            
            # Try with a larger window to account for time drift
            result = totp.verify(token, valid_window=2)  # Allows ±2 time steps (±60 seconds)
            
            print(f"Verification result: {result}")
            if not result:
                # Try nearby time windows
                for offset in [-1, 0, 1]:
                    test_time = current_time + (30 * offset)
                    test_token = totp.at(test_time)
                    print(f"Testing time offset {offset*30}s: {test_token}")
                    if test_token == token:
                        print(f"Token matches at offset {offset*30}s")
                        result = True
                        break
            
            return result
        except Exception as e:
            print(f"Error in verify_mfa_token: {str(e)}")
            print(f"Token type: {type(token)}")
            return False

    @staticmethod
    def generate_qr_code(uri):
        """Generate QR code as base64 string"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode() 

    @staticmethod
    def get_totp_uri_for_setup(email: str, secret: str):
        """Generate TOTP URI for initial setup"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=email,
            issuer_name="FileFortress"
        )

    @staticmethod
    def verify_totp(secret: str, token: str):
        """Verify a TOTP token with given secret"""
        print("\n=== TOTP Verification ===")
        print(f"Secret: {secret}")
        print(f"Token: {token}")
        
        if not secret or not token:
            print("Error: Missing secret or token")
            return False
        
        try:
            totp = pyotp.TOTP(secret)
            current_time = int(time.time())
            print(f"Current timestamp: {current_time}")
            
            # Try with a larger window to account for time drift
            result = totp.verify(token, valid_window=2)  # Allows ±2 time steps (±60 seconds)
            print(f"Initial verification result: {result}")
            
            if not result:
                # Try nearby time windows
                for offset in [-2, -1, 0, 1, 2]:
                    test_time = current_time + (30 * offset)
                    test_token = totp.at(test_time)
                    print(f"Testing time offset {offset*30}s: {test_token}")
                    if test_token == token:
                        print(f"Token matches at offset {offset*30}s")
                        result = True
                        break
                
                # For debugging, show expected tokens
                print(f"Expected tokens in window:")
                for offset in range(-2, 3):
                    print(f"  {offset*30}s offset: {totp.at(current_time + (30 * offset))}")
            
            print(f"Final verification result: {result}")
            return result
        except Exception as e:
            print(f"TOTP verification error: {str(e)}")
            print(f"Token type: {type(token)}")
            return False 