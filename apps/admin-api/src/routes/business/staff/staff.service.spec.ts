import { EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { mailer } from '@/common/tools/Mailer';
import { Invitation, InvitationStatus, Member, Organization, RoleType, User, Verification } from '@/entities';

import { StaffService } from './staff.service';

describe('Service StaffService (DB)', () => {
  let service: StaffService;
  let orm: MikroORM;
  let em: EntityManager;
  let appModule: TestingModule;

  const withRequestContext = <T>(callback: () => Promise<T>) =>
    RequestContext.create(em, callback);

  beforeAll(async () => {
    appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = appModule.get<StaffService>(StaffService);
    orm = appModule.get<MikroORM>(MikroORM);
    em = appModule.get<EntityManager>(EntityManager);
    jest.spyOn(mailer, 'sendMail').mockResolvedValue({} as never);
  });

  afterAll(async () => {
    await orm.close();
    await appModule.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Invitation Flow', () => {
    let organization: Organization;
    let inviter: User;
    const staffEmail = 'invited-staff@example.com';
    const staffName = 'Invited Staff';

    beforeEach(async () => {
      await withRequestContext(async () => {
        const currentEm = RequestContext.getEntityManager()!;

        // Clean up
        await currentEm.nativeDelete(Verification, { identifier: staffEmail });
        await currentEm.nativeDelete(Invitation, { email: staffEmail });
        await currentEm.nativeDelete(Member, { user: { email: { $in: [staffEmail, 'inviter@example.com'] } } });
        await currentEm.nativeDelete(User, { email: { $in: [staffEmail, 'inviter@example.com'] } });
        await currentEm.nativeDelete(Organization, { name: 'Business Test Org' });

        organization = currentEm.create(Organization, {
          name: 'Business Test Org',
        });

        inviter = currentEm.create(User, {
          email: 'inviter@example.com',
          name: 'Inviter',
          emailVerified: true,
        });

        currentEm.persist([organization, inviter]);
        await currentEm.flush();
      });
    });

    it('invite should create a pending invitation and verification', async () => {
      await withRequestContext(async () => {
        const invitation = await service.invite(organization.id, inviter.id, {
          email: staffEmail,
          name: staffName,
          role: RoleType.ADMIN,
        });

        expect(invitation).toBeDefined();
        expect(invitation.email).toBe(staffEmail);
        expect(invitation.status).toBe(InvitationStatus.PENDING);

        // JWT 토큰은 메일러를 통해 발송되므로 호출 인자에서 추출
        const lastCall = (mailer.sendMail as jest.Mock).mock.calls.at(-1)[0];
        const inviteUrl = lastCall.html.match(/href="([^"]+)"/)[1];
        const token = new URL(inviteUrl).searchParams.get('token');

        expect(token).toBeDefined();
        expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
          to: expect.stringContaining(staffEmail),
        }));
      });
    });

    it('findInvitation should find by JWT token', async () => {
      await withRequestContext(async () => {
        await service.invite(organization.id, inviter.id, {
          email: staffEmail,
          name: staffName,
          role: RoleType.ADMIN,
        });

        const lastCall = (mailer.sendMail as jest.Mock).mock.calls.at(-1)[0];
        const inviteUrl = lastCall.html.match(/href="([^"]+)"/)[1];
        const token = new URL(inviteUrl).searchParams.get('token')!;

        const found = await service.findInvitation(token);
        expect(found).toBeDefined();
        expect(found.email).toBe(staffEmail);
      });
    });

    it('acceptInvite should succeed and create a member', async () => {
      await withRequestContext(async () => {
        await service.invite(organization.id, inviter.id, {
          email: staffEmail,
          name: staffName,
          role: RoleType.ADMIN,
        });

        const currentEm = RequestContext.getEntityManager()!;
        const lastCall = (mailer.sendMail as jest.Mock).mock.calls.at(-1)[0];
        const inviteUrl = lastCall.html.match(/href="([^"]+)"/)[1];
        const token = new URL(inviteUrl).searchParams.get('token')!;

        // Create the user who will accept (must match email)
        const acceptingUser = currentEm.create(User, {
          email: staffEmail,
          name: staffName,
          emailVerified: true,
        });
        currentEm.persist(acceptingUser);
        await currentEm.flush();

        const member = await service.acceptInvite(token, acceptingUser.id);
        expect(member).toBeDefined();
        expect(member.role).toBe(RoleType.ADMIN);

        const updatedInvitation = await currentEm.findOne(Invitation, { email: staffEmail });
        expect(updatedInvitation?.status).toBe(InvitationStatus.ACCEPTED);
      });
    });

    it('rejectInvite should update status to rejected', async () => {
      await withRequestContext(async () => {
        await service.invite(organization.id, inviter.id, {
          email: staffEmail,
          name: staffName,
          role: RoleType.ADMIN,
        });

        const currentEm = RequestContext.getEntityManager()!;
        const lastCall = (mailer.sendMail as jest.Mock).mock.calls.at(-1)[0];
        const inviteUrl = lastCall.html.match(/href="([^"]+)"/)[1];
        const token = new URL(inviteUrl).searchParams.get('token')!;

        await service.rejectInvite(token);

        const found = await currentEm.findOne(Invitation, { email: staffEmail });
        expect(found?.status).toBe(InvitationStatus.REJECTED);
      });
    });
  });
});
