/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';

jest.mock('otplib', () => ({
  verify: jest.fn(),
}));
import { verify } from 'otplib';

import { AppModule } from '@/app.module';
import { Account, OrganizationType, ProviderType, User, Verification } from '@/entities';

import { SignInService } from './sign-in.service';

describe('SignIn Service', () => {
  let em: EntityManager;
  let app: TestingModule;
  let service: SignInService;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => callback(em));

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = app.get<SignInService>(SignInService);
    em = app.get<EntityManager>(EntityManager);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Login process with Database', () => {
    let testUserId: string;
    const password = 'password123';

    beforeAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Clean start: remove any leftovers from previous failed runs
        const existingUsers = await forkedEm.find(User, {
          $or: [
            { name: 'Test Login User' },
            { email: { $like: 'login-service-%' } },
          ],
        });
        const existingUserIds = existingUsers.map((u) => u.id);
        if (existingUserIds.length > 0) {
          await forkedEm.nativeDelete(Account, { user: { $in: existingUserIds } });
          await forkedEm.nativeDelete(Verification, { identifier: { $in: existingUsers.map((u) => u.email) } });
          await forkedEm.nativeDelete(User, { id: { $in: existingUserIds } });
        }
        await forkedEm.flush();
      });
    });

    beforeEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const user = forkedEm.create(User, {
          name: 'Test Login User',
          email: `login-service-${Date.now()}@example.com`,
          emailVerified: true,
        });

        forkedEm.create(Account, {
          user,
          accountId: user.email,
          providerId: ProviderType.CREDENTIAL,
          password: await bcrypt.hash(password, 10),
          failCount: 0,
        });

        forkedEm.persist(user);
        await forkedEm.flush();
        testUserId = user.id;
      });
    });

    afterEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const users = await forkedEm.find(User, {
          $or: [
            { name: 'Test Login User' },
            { email: { $like: 'login-service-%' } },
          ],
        });
        const userIds = users.map((u) => u.id);

        if (userIds.length > 0) {
          await forkedEm.nativeDelete(Account, { user: { $in: userIds } });
          await forkedEm.nativeDelete(Verification, { identifier: { $in: users.map((u) => u.email) } });
          await forkedEm.nativeDelete(User, { id: { $in: userIds } });
        }
        await forkedEm.flush();
      });
    });

    it('should validate user successfully', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        const validated = await service.validateUser({
          accountId: user.email,
          password,
        });
        expect(validated.id).toBe(user.id);
      });
    });

    it('should handle wrong password and increment failCount', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        await expect(service.validateUser({
          accountId: user.email,
          password: 'wrong-password',
        })).rejects.toThrow('INVALID_CREDENTIALS');

        const updatedAccount = await forkedEm.findOneOrFail(Account, { accountId: user.email });
        expect(updatedAccount.failCount).toBe(1);
      });
    });

    it('should block account after 5 failed attempts', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        const account = await forkedEm.findOneOrFail(Account, { user: user.id });
        account.failCount = 5;
        await forkedEm.flush();

        await expect(service.validateUser({
          accountId: user.email,
          password: 'password123',
        })).rejects.toThrow('ACCOUNT_LOCKED');
      });
    });

    it('should create organization and member for first-time user', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId, { populate: ['member'] });
        const member = await service.createOrganization(user, { name: 'My Test Biz' });

        expect(member).toBeDefined();
        expect(member.organization.name).toBe('My Test Biz');
        expect(member.organization.metadata.type).toBe(OrganizationType.BUSINESS);
      });
    });

    it('should reset password with verification code', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);

        // Create verification
        const verification = forkedEm.create(Verification, {
          identifier: user.email,
          value: 'secret-token',
          expiresAt: new Date(Date.now() + 1000 * 60),
          throttleKey: `login-reset-${user.email}`,
        });
        forkedEm.persist(verification);
        await forkedEm.flush();

        (verify as jest.Mock).mockResolvedValue({ valid: true });

        await service.resetPassword({
          token: 'some-token',
          password: 'new-password-123',
          confirmPassword: 'new-password-123',
        });

        (verify as jest.Mock).mockRestore();

        const updatedAccount = await forkedEm.findOneOrFail(Account, { user: user.id });
        expect(await bcrypt.compare('new-password-123', updatedAccount.password!)).toBe(true);
      });
    });

    it('should require 2FA token if twoFactorEnabled is true', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        user.twoFactorEnabled = true;
        user.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
        await forkedEm.flush();

        await expect(service.validateUser({
          accountId: user.email,
          password,
        })).rejects.toThrow('TWO_FACTOR_ENABLED');
      });
    });

    it('should throw error on invalid 2FA token', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        user.twoFactorEnabled = true;
        user.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
        await forkedEm.flush();

        (verify as jest.Mock).mockResolvedValue({ valid: false });

        await expect(service.validateUser({
          accountId: user.email,
          password,
          token: 'wrong-token',
        })).rejects.toThrow('INVALID_TWO_FACTOR_TOKEN');

        (verify as jest.Mock).mockRestore();
      });
    });

    it('should succeed with valid 2FA token', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);
        user.twoFactorEnabled = true;
        user.twoFactorSecret = 'JBSWY3DPEHPK3PXP';
        await forkedEm.flush();

        (verify as jest.Mock).mockResolvedValue({ valid: true });

        const validated = await service.validateUser({
          accountId: user.email,
          password,
          token: '123456',
        });

        expect(validated.id).toBe(user.id);
        (verify as jest.Mock).mockRestore();
      });
    });
  });
});
