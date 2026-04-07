/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';

import { Account, ProviderType, Term, TermAgreement, TermCategory, TermType, User } from '@/entities';

import { ProfileModule } from './profile.module';
import { ProfileService } from './profile.service';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('ProfileService', () => {
  let em: EntityManager;
  let app: TestingModule;
  let service: ProfileService;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => {
      const forkedEm = RequestContext.getEntityManager() as EntityManager;
      return callback(forkedEm);
    });

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [ProfileModule],
    }).compile();

    service = app.get<ProfileService>(ProfileService);
    em = app.get<EntityManager>(EntityManager);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Operations with Database', () => {
    let testUserId: string;
    let testTermId: string;

    beforeEach(async () => {
      await withRequestContext(async (forkedEm) => {
        // Create Test User
        const user = forkedEm.create(User, {
          name: 'Test Profile User',
          email: `profile-${Date.now()}@example.com`,
          emailVerified: true,
        });

        // Create Test Account
        forkedEm.create(Account, {
          user: user,
          accountId: user.email,
          providerId: ProviderType.CREDENTIAL,
          password: await bcrypt.hash('old-password', 10),
          failCount: 0,
        });

        // Create Term Category and Term
        const category = forkedEm.create(TermCategory, {
          title: 'Terms of Use',
          termType: TermType.REQUIRED,
          isActive: true,
        });

        const term = forkedEm.create(Term, {
          category,
          content: 'Test content',
          version: '1.0',
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        forkedEm.persist([user, category, term]);
        await forkedEm.flush();

        testUserId = user.id;
        testTermId = term.id;
      });
    });

    afterEach(async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOne(User, { id: testUserId }, { populate: ['account', 'termAgreements'] });
        if (user) {
          await forkedEm.remove(user).flush();
        }

        // Find by ID to clean up
        const term = await forkedEm.findOne(Term, { id: testTermId }, { populate: ['category'] });
        if (term) {
          const category = term.category;
          await forkedEm.remove(term).flush();
          await forkedEm.remove(category).flush();
        }
      });
    });

    it('should change password successfully', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId, { populate: ['account'] });

        await service.changePassword(user, {
          currentPassword: 'old-password',
          newPassword: 'new-password',
          confirmPassword: 'new-password',
        });

        const updatedAccount = await forkedEm.findOneOrFail(Account, { user: user.id });
        expect(await bcrypt.compare('new-password', updatedAccount.password!)).toBe(true);
      });
    });

    it('should fail password change if current password is wrong', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId, { populate: ['account'] });

        await expect(service.changePassword(user, {
          currentPassword: 'wrong-password',
          newPassword: 'new-password',
          confirmPassword: 'new-password',
        }))
          .rejects.toThrow('Current password is incorrect');
      });
    });

    it('should generate and verify 2FA', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId);

        const { secret } = await service.generate2FASecret(user);
        expect(secret).toBeDefined();

        await expect(service.verifyAndEnable2FA(user, {
          token: '000000',
          secret: secret,
        }))
          .rejects.toThrow();
      });
    });

    it('should handle terms agreements', async () => {
      await withRequestContext(async (forkedEm) => {
        const user = await forkedEm.findOneOrFail(User, testUserId, { populate: ['member', 'member.organization'] });

        // Agree to terms
        await service.agreeToTerms(user, { termIds: [testTermId] });

        const history = await service.getAgreementsHistory(user);
        expect(history.length).toBeGreaterThan(0);

        // Find agreement to withdraw
        const agreement = await forkedEm.findOneOrFail(TermAgreement, { user: user.id, term: testTermId });

        // Withdraw agreement
        await service.withdrawAgreement(user, { agreementId: agreement.id });

        const updatedAgreement = await forkedEm.findOneOrFail(TermAgreement, agreement.id, { filters: false });
        expect(updatedAgreement.deletedAt).toBeDefined();
      });
    });
  });

  describe('File Upload (Mocked FS)', () => {
    it('should throw error if file is missing', async () => {
      await withRequestContext(async () => {
        await expect(service.uploadProfileImage({} as User))
          .rejects.toThrow('FILE_REQUIRED');
      });
    });
  });
});
