import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest, UserRole } from '../types';
import { Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authService = new AuthService();

router.post('/register', strictRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role, preferredLanguage } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name, role' });
    }
    if (!['fan', 'vendor', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: fan, vendor, manager' });
    }
    const result = await authService.register({ email, password, name, role, preferredLanguage });
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', strictRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
