import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { validateEmail, validatePassword } from '../utils/validation';
import authService from '../services/authService';

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string[];
    confirmPassword?: string;
    serverError?: string;
    mfa?: string;
}

const Register: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [showMFASetup, setShowMFASetup] = useState(false);
    
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });

    const [mfaData, setMFAData] = useState<any>(null);
    const [mfaToken, setMfaToken] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!userData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!userData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!userData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(userData.email)) newErrors.email = 'Invalid email format';
        
        if (!userData.password) newErrors.password = 'Password is required';
        else if (userData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        
        if (userData.password !== userData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const result = await authService.register({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password,
                role: userData.role
            });
            
            if (result) {
                setMFAData({
                    qrCode: result.mfa_qr_code,
                    secret: result.mfa_secret
                });
                setShowMFASetup(true);
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            if (errorData?.fields) {
                setErrors(errorData.fields);
            } else if (errorData?.field) {
                setErrors({ [errorData.field]: errorData.error });
            } else {
                setErrors({ serverError: errorData?.error || 'Registration failed' });
            }
        }
    };

    const handleMFASetup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formattedToken = mfaToken.padStart(6, '0');
            
            const result = await authService.completeRegistration({
                token: formattedToken,
            });

            if (result) {
                alert('Registration completed successfully! Please login.');
                navigate('/login');
            }
        } catch (error: any) {
            const errorData = error.response?.data;
            setErrors({
                mfa: errorData?.error || errorData?.detail || 'Invalid MFA code'
            });
        }
    };

    return showMFASetup ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-gray-900">Set Up Two-Factor Authentication</h2>
                <div className="flex flex-col items-center space-y-6">
                    <img 
                        src={`data:image/png;base64,${mfaData.qrCode}`} 
                        alt="MFA QR Code"
                        className="w-48 h-48"
                    />
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Secret Key:</p>
                        <code className="block mt-1 p-2 bg-gray-100 rounded select-all">{mfaData.secret}</code>
                    </div>
                    <form onSubmit={handleMFASetup} className="w-full space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter the 6-digit code from your authenticator app:
                            </label>
                            <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                                placeholder="000000"
                                autoFocus
                            />
                        </div>
                        {errors.mfa && (
                            <div className="text-red-500 text-sm text-center mt-2">{errors.mfa}</div>
                        )}
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200"
                        >
                            Verify and Complete Registration
                        </button>
                    </form>
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-900">Create Account</h2>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    value={userData.firstName}
                                    onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                                    className={`mt-1 w-full px-3 py-2 border ${
                                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    value={userData.lastName}
                                    onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                                    className={`mt-1 w-full px-3 py-2 border ${
                                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData({...userData, email: e.target.value})}
                                className={`mt-1 w-full px-3 py-2 border ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={userData.password}
                                onChange={(e) => setUserData({...userData, password: e.target.value})}
                                className={`mt-1 w-full px-3 py-2 border ${
                                    errors.password ? 'border-red-500' : 'border-gray-300'
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                value={userData.confirmPassword}
                                onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                                className={`mt-1 w-full px-3 py-2 border ${
                                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>
                    {errors.serverError && (
                        <div className="text-red-500 text-sm text-center">{errors.serverError}</div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200"
                    >
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register; 