import { supabase } from './supabaseClient';
import { Profile } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, RegisterDTO } from '../types/api';

export const authService = {
  // Register a new user in Supabase Auth and let DB triggers initialize profiles/wallets
  async register(dto: RegisterDTO): Promise<ServiceResponse<Profile>> {
    try {
      const email = dto.email || `${dto.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@agritrust.com`;
      const password = dto.password || 'password123'; // Default fallback for rapid hackathon testing

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: dto.fullName,
            role: dto.role
          }
        }
      });

      if (error) {
        return makeErrorResponse(`Registration failed: ${error.message}`, error.message);
      }

      if (!data.user) {
        return makeErrorResponse('Registration failed: User session could not be established.');
      }

      // Fetch the created profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        // Fallback: DB trigger may take 1-2 seconds, retrieve or return manual object
        const manualProfile: Profile = {
          id: data.user.id,
          role: dto.role,
          full_name: dto.fullName,
          trust_score: 100,
          trades_completed: 0,
          is_verified: false,
          created_at: new Date().toISOString()
        };
        return makeResponse(true, 'User registered. Wallet pending creation.', manualProfile);
      }

      return makeResponse(true, 'User registered successfully on-chain.', profile as Profile);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected registration error: ${err.message}`, err.message);
    }
  },

  // Log in using password credentials
  async login(email: string, password = 'password123'): Promise<ServiceResponse<Profile>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return makeErrorResponse(`Login failed: ${error.message}`, error.message);
      }

      if (!data.user) {
        return makeErrorResponse('Login failed: Session missing.');
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        return makeErrorResponse('Login succeeded but user profile was not found.', profileErr?.message);
      }

      return makeResponse(true, 'Login succeeded.', profile as Profile);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected login error: ${err.message}`, err.message);
    }
  },

  // Log out session
  async logout(): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return makeErrorResponse(`Logout failed: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Logged out successfully.', true);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected logout error: ${err.message}`, err.message);
    }
  },

  // Retrieve current active user profile
  async getCurrentUser(): Promise<ServiceResponse<Profile>> {
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        return makeErrorResponse('No active session found.', userErr?.message);
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        return makeErrorResponse('Profile details not found for session user.', profileErr?.message);
      }

      return makeResponse(true, 'Active session restored.', profile as Profile);
    } catch (err: any) {
      return makeErrorResponse(`Error fetching current user session: ${err.message}`, err.message);
    }
  }
};
export default authService;
