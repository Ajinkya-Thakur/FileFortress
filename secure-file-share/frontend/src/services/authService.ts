import axiosInstance from './axiosConfig';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
}

const authService = {
    async login(credentials: LoginCredentials) {
        try {
            const response = await axiosInstance.post('/auth/login/', credentials);
            if (!response.data.require_mfa) {
                // If MFA not required, store token
                localStorage.setItem('access_token', response.data.access);
            }
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error.response?.data);
            throw error;
        }
    },

    async register(userData: RegisterData) {
        const requestData = {
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            password: userData.password,
            role: userData.role || 'user'
        };
        
        try {
            const response = await axiosInstance.post('/auth/register/', requestData);
            console.log('Registration response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Registration error:', error.response?.data);
            throw error;
        }
    },

    async logout() {
        localStorage.removeItem('access_token');
    },

    async getCurrentUser() {
        const response = await axiosInstance.get('/auth/me/');
        return response.data;
    },

    async initiateMFASetup() {
        try {
            const response = await axiosInstance.get('/auth/initiate_mfa/');
            return response.data;
        } catch (error: any) {
            console.error('MFA setup error:', error.response?.data);
            throw error;
        }
    },

    async verifyMFASetup(token: string) {
        try {
            const response = await axiosInstance.post('/auth/verify_mfa_setup/', { token });
            return response.data;
        } catch (error: any) {
            console.error('MFA verification error:', error.response?.data);
            throw error;
        }
    },

    async verifyMFA(userId: string, token: string) {
        try {
            const response = await axiosInstance.post('/auth/verify_mfa/', {
                user_id: userId,
                token: token
            });
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
            }
            return response.data;
        } catch (error: any) {
            console.error('MFA verification error:', error.response?.data);
            throw error;
        }
    },

    async completeRegistration(data: { token: string }) {
        try {
            const response = await axiosInstance.post(
                `/auth/complete_registration/`,
                data,
                {
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default authService; 