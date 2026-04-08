/* eslint-disable sonarjs/no-hardcoded-passwords */
import { EntityManager, RequestContext } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { fail } from 'assert';
import * as bcrypt from 'bcrypt';

import { AppModule } from '@/app.module';
import { ErrorException } from '@/common/exceptions/error.exception';
import { Account, Invitation, InvitationStatus, Member, Organization, OrganizationMetadata, OrganizationRole, OrganizationType, RoleType, Term, TermAgreement, TermCategory, TermType, User, Verification } from '@/entities';

import { SignUpService } from './sign-up.service';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'secret'),
  generate: jest.fn(() => '111111'),
  verify: jest.fn(() => ({ valid: true })),
}));

describe('SignUp Service', () => {
  let em: EntityManager;
  let app: TestingModule;
  let service: SignUpService;

  const withRequestContext = <T>(callback: (em: EntityManager) => Promise<T>) =>
    RequestContext.create(em, () => callback(em));

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = app.get<SignUpService>(SignUpService);
    em = app.get<EntityManager>(EntityManager);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Account creation with Database', () => {
    let testTermId: string;
    let testCategoryId: string;

    beforeAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Clean start: remove any leftovers from previous failed runs
        const existingCategory = await forkedEm.findOne(TermCategory, { title: 'Required Term to Sign-Up' });
        if (existingCategory) {
          await forkedEm.nativeDelete(Term, { category: existingCategory.id });
          await forkedEm.nativeDelete(TermCategory, { id: existingCategory.id });
        }

        const category = forkedEm.create(TermCategory, {
          title: 'Required Term to Sign-Up',
          termType: TermType.REQUIRED,
          isActive: true,
        });

        const term = forkedEm.create(Term, {
          category,
          content: 'I agree to everything',
          version: '1.0',
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        forkedEm.persist([category, term]);
        await forkedEm.flush();
        testTermId = term.id;
        testCategoryId = category.id;
      });
    });

    afterEach(async () => {
      await withRequestContext(async (forkedEm) => {
        // 1. Find all test-related users (both signup and inviter)
        const users = await forkedEm.find(User, {
          $or: [
            { email: { $like: 'signup-%' } },
            { email: { $like: 'inviter-%' } },
          ],
        });
        const userIds = users.map((u) => u.id);

        if (userIds.length > 0) {
          // 2. Delete dependents on User
          await forkedEm.nativeDelete(Member, { user: { $in: userIds } });
          await forkedEm.nativeDelete(Account, { user: { $in: userIds } });
          await forkedEm.nativeDelete(TermAgreement, { user: { $in: userIds } });
        }

        // 3. Delete Invitations (by email OR inviter ID)
        await forkedEm.nativeDelete(Invitation, {
          $or: [
            { email: { $like: 'signup-%' } },
            { inviter: { $in: userIds } },
          ],
        });

        // 4. Delete Organizations created in tests
        const orgs = await forkedEm.find(Organization, { name: 'Inviting Org' });
        const orgIds = orgs.map((o) => o.id);
        if (orgIds.length > 0) {
          await forkedEm.nativeDelete(Member, { organization: { $in: orgIds } });
          await forkedEm.nativeDelete(OrganizationRole, { organization: { $in: orgIds } });
          await forkedEm.nativeDelete(Organization, { id: { $in: orgIds } });
        }

        // 5. Finally delete Users
        if (userIds.length > 0) {
          await forkedEm.nativeDelete(User, { id: { $in: userIds } });
        }

        // 6. Delete Verifications
        await forkedEm.nativeDelete(Verification, {
          $or: [
            { identifier: { $like: 'signup-%' } },
            { identifier: { $in: ['010-9999-8888', '01011112222'] } },
          ],
        });

        await forkedEm.flush();
      });
    });

    afterAll(async () => {
      await withRequestContext(async (forkedEm) => {
        // Delete shared Terms and Categories
        if (testCategoryId) {
          await forkedEm.nativeDelete(Term, { category: testCategoryId });
          await forkedEm.nativeDelete(TermCategory, { id: testCategoryId });
        }
        await forkedEm.flush();
      });
    });

    it('should check if email exists', async () => {
      await withRequestContext(async (forkedEm) => {
        const email = `signup-${Date.now()}@test.com`;
        const exists = await service.checkEmailConflict({ email });
        expect(exists).toBe(false);

        const user = forkedEm.create(User, { name: 'E', email, emailVerified: true });
        forkedEm.persist(user);
        await forkedEm.flush();

        try {
          await service.checkEmailConflict({ email });
          fail('should throw');
        }
        catch (error) {
          expect(error).toBeInstanceOf(ErrorException);
          expect((error as ErrorException).code).toBe('USER_ALREADY_EXISTS');
        }
      });
    });

    it('should create tokens and verify phone', async () => {
      await withRequestContext(async (forkedEm) => {
        const identifier = '01011112222';
        const token = await service.requestPhoneVerification({ phoneNumber: identifier });

        expect(token).toBeDefined();

        const verification = await forkedEm.findOneOrFail(Verification, { identifier });
        expect(verification.value).toBeDefined();

        // otplib is mocked at the top of the file
        await service.confirmPhoneVerification({ phoneNumber: identifier, token: '111111' });

        const deletedVerification = await forkedEm.findOne(Verification, { identifier });
        expect(deletedVerification).toBeNull();
      });
    });

    it('should create full account and member for invited user', async () => {
      await withRequestContext(async (forkedEm) => {
        const email = `signup-${Date.now()}@invited.com`;

        const inviter = forkedEm.create(User, {
          name: 'Inviter User',
          email: `inviter-${Date.now()}@test.com`,
          emailVerified: true,
        });

        const org = forkedEm.create(Organization,
          {
            name: 'Inviting Org',
            metadata: new OrganizationMetadata(OrganizationType.BUSINESS),
          });
        const invitation = forkedEm.create(Invitation, {
          email,
          name: 'New User Name',
          role: RoleType.ADMIN,
          status: InvitationStatus.PENDING,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          organization: org,
          inviter,
        });
        forkedEm.persist([inviter, org, invitation]);
        await forkedEm.flush();

        const systemTerms = await forkedEm.find(Term, {
          category: { organization: null },
        });

        const signupDto = {
          name: 'Invited User',
          email,
          phoneNumber: '01011112222',
          termIds: [...systemTerms.map((t) => t.id), testTermId],
          password: 'secret-password',
          confirmPassword: 'secret-password',
        };

        const resultUser = await service.createAccount('11111', signupDto);

        expect(resultUser).toBeDefined();
        expect(resultUser.email).toBe(email);

        const account = await forkedEm.findOneOrFail(Account, { user: resultUser.id });
        expect(await bcrypt.compare('secret-password', account.password!)).toBe(true);
      });
    });
  });
});
