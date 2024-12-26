from django.shortcuts import render
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    MFATokenSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer
)
from .services.auth_service import AuthService
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp

User = get_user_model()

class AuthViewSet(viewsets.ViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        print("\n=== Registration Process ===")
        print(f"Session before: {dict(request.session)}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        try:
            if serializer.is_valid():
                validated_data = serializer.validated_data
                
                if User.objects.filter(email=validated_data['email']).exists():
                    return Response({
                        'error': 'Email already registered',
                        'field': 'email'
                    }, status=status.HTTP_400_BAD_REQUEST)

                mfa_secret = AuthService.generate_mfa_secret()
                request.session['pending_registration'] = {
                    'validated_data': validated_data,
                    'mfa_secret': mfa_secret
                }
                request.session.modified = True  # Ensure session is saved
                
                print(f"Session after: {dict(request.session)}")
                print(f"MFA Secret generated: {mfa_secret}")
                
                totp_uri = AuthService.get_totp_uri_for_setup(
                    email=validated_data['email'],
                    secret=mfa_secret
                )
                qr_code = AuthService.generate_qr_code(totp_uri)
                
                return Response({
                    'mfa_qr_code': qr_code,
                    'mfa_secret': mfa_secret,
                    'message': 'Please complete MFA setup'
                })
            
            return Response({
                'error': 'Validation failed',
                'fields': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'error': 'Registration failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def complete_registration(self, request):
        print("\n=== Complete Registration Process ===")
        print(f"Session data: {dict(request.session)}")
        print(f"Request data: {request.data}")
        
        token = request.data.get('token')
        pending_data = request.session.get('pending_registration')
        
        if not pending_data:
            print("No pending registration in session")
            print(f"Available session keys: {request.session.keys()}")
            return Response({
                'error': 'No pending registration found',
                'detail': 'Session may have expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mfa_secret = pending_data['mfa_secret']
            print(f"Found MFA secret: {mfa_secret}")
            print(f"Verifying token: {token}")
            
            # Ensure token is properly formatted
            token = str(token).zfill(6)
            
            # Generate current valid token for comparison
            totp = pyotp.TOTP(mfa_secret)
            current_token = totp.now()
            print(f"Current valid token would be: {current_token}")
            
            if not AuthService.verify_totp(mfa_secret, token):
                return Response({
                    'error': 'Invalid MFA token',
                    'detail': 'Please check your authenticator app'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user with MFA secret
            validated_data = pending_data['validated_data']
            print(f"Creating user with data: {validated_data}")
            
            user = User.objects.create_user(
                **validated_data,
                mfa_secret=mfa_secret
            )
            
            print(f"User created successfully: {user.email}")
            
            # Clear pending registration
            del request.session['pending_registration']
            print("Cleared pending registration from session")
            
            return Response({
                'message': 'Registration completed successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error during registration completion: {str(e)}")
            return Response({
                'error': 'Failed to create user',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def login(self, request):
        try:
            serializer = CustomTokenObtainPairSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'error': 'Invalid credentials',
                    'fields': serializer.errors
                }, status=status.HTTP_401_UNAUTHORIZED)

            user = serializer.user
            return Response({
                'require_mfa': True,
                'user_id': user.id,
                'message': 'MFA verification required'
            })
        except Exception as e:
            return Response({
                'error': 'Login failed',
                'detail': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def verify_mfa(self, request):
        user_id = request.data.get('user_id')
        token = request.data.get('token')

        print("\n=== MFA Verification Process ===")
        print(f"Request Data: {request.data}")

        if not user_id or not token:
            print("Error: Missing required fields")
            print(f"user_id: {user_id}, token: {token}")
            return Response({
                'error': 'Missing required fields',
                'detail': 'Both user_id and token are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Ensure token is properly formatted
            token = str(token).zfill(6)  # Ensure 6 digits with leading zeros
            user = User.objects.get(id=user_id)
            
            print(f"Found user: {user.email}")
            print(f"MFA Secret: {user.mfa_secret}")
            print(f"Formatted token: {token}")

            verification_result = AuthService.verify_mfa_token(user, token)
            print(f"Token verification result: {verification_result}")

            if verification_result:
                refresh = RefreshToken.for_user(user)
                print("Token verification successful, generating JWT")
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data
                })

            print("Token verification failed")
            return Response({
                'error': 'Invalid MFA token',
                'detail': 'Please check your authenticator app and try again. Make sure your device time is synchronized.'
            }, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            print(f"Error: User not found with ID: {user_id}")
            return Response({
                'error': 'User not found',
                'detail': 'Invalid user ID provided'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unexpected error during MFA verification: {str(e)}")
            return Response({
                'error': 'Verification failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
