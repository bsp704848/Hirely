import axios from 'axios'
import { defineStore } from 'pinia'

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        role: localStorage.getItem('role') || '',
        isLoading: false,
    }),

    getters: {
        username: (state) => state.user?.username || '',
        isLoggedIn: (state) => !!state.user
    },

    actions: {
        async register(userData) {
            await axios.post(`${baseURL}/auth/register`, userData);
        },

        async login(userData) {
            try {
                this.isLoading = true;

                const res = await axios.post(`${baseURL}/auth/login`, userData, {
                    headers: { 'Content-Type': 'application/json' }
                });

                this.user = res.data.user;
                this.role = res.data.user.role;

                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('role', res.data.user.role);
                localStorage.setItem('token', res.data.token); 

                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

                return res.data.user; 

            } catch (error) {
                console.error('Login error:', error.response?.data || error.message);
                throw error;
            } finally {
                this.isLoading = false;
            }
        }, 

        async googleLogin(googleToken) {
            try {
                this.isLoading = true;

                const res = await axios.post(`${baseURL}/auth/google`, { token: googleToken });

                this.user = res.data.user;
                this.role = res.data.user.role;

                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('role', res.data.user.role);
                localStorage.setItem('token', res.data.token);

                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

                return res.data.user;

            } catch (error) {
                console.error('Google login error:', error.response?.data || error.message);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async fetchUser(router = null) {
            try {
                this.isLoading = true;

                const token = localStorage.getItem('token');
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }


                const res = await axios.get(`${baseURL}/auth/me`);

                if (res.data.user) {
                    this.user = res.data.user;
                    this.role = res.data.user.role;

                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    localStorage.setItem('role', res.data.user.role);

                    return res.data.user;
                }

            } catch (error) {
                console.error('Fetch user error:', error.response?.data || error.message);

               
                if (error.response?.status === 401) {
                    this.clearUserData();
                    if (router) router.push('/login');
                }
                return null;

            } finally {
                this.isLoading = false;
            }
        },

        clearUserData() {
            this.user = null;
            this.role = '';
          

            localStorage.removeItem('user');
            localStorage.removeItem('role');
            localStorage.removeItem('token');

            delete axios.defaults.headers.common['Authorization'];

            document.cookie = 'token=; Max-Age=0; Path=/; SameSite=Lax';
        },

        async logout() {
            this.clearUserData(); 
          
            try {
                await axios.get(`${baseURL}/auth/logout`);
            } catch (err) {
              console.warn('Logout API failed:', err.message);
            }
          
            this.isLoading = false;
          }
          
    }
});
