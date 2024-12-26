import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthenticated } from '../store/slices/authSlice';
import authService from '../services/authService';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector(state => state.auth);
    const [showMFAVerification, setShowMFAVerification] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [mfaToken, setMfaToken] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        try {
            const response = await authService.login(credentials);
            if (response.require_mfa) {
                setUserId(response.user_id);
                setShowMFAVerification(true);
            }
        } catch (err: any) {
            console.error('Login failed:', err);
            setErrors({
                auth: err.response?.data?.error || 'Invalid credentials'
            });
        }
    };

    const handleMFAVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            const formattedToken = mfaToken.padStart(6, '0');
            const response = await authService.verifyMFA(userId!, formattedToken);
            
            if (response.access) {
                // Store tokens
                localStorage.setItem('access_token', response.access);
                localStorage.setItem('refresh_token', response.refresh);
                
                // Use setAuthenticated instead of login
                dispatch(setAuthenticated(response));
                navigate('/dashboard');
            }
        } catch (error: any) {
            setErrors({
                mfa: error.response?.data?.error || 'MFA verification failed'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                        {showMFAVerification ? 'Enter MFA Code' : 'Sign in to FileFortress'}
                    </h2>
                </div>
                {!showMFAVerification ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                />
                            </div>
                        </div>

                        {errors.auth && (
                            <div className="text-red-500 text-sm text-center">{errors.auth}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Don't have an account? Register
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleMFAVerify} className="mt-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter the 6-digit code from your authenticator app:
                            </label>
                            <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-center text-2xl tracking-widest"
                                placeholder="000000"
                                autoFocus
                            />
                        </div>

                        {errors.mfa && (
                            <div className="text-red-500 text-sm text-center mt-2">{errors.mfa}</div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || mfaToken.length !== 6}
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login; 