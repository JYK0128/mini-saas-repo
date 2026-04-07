import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { serial } from '@repo/utils';
import * as bcrypt from 'bcrypt';

import { Account, Member, Organization, OrganizationMetadata, OrganizationType, ProviderType, RoleType, Term, TermCategory, TermType, User } from '@/entities';

const name = 'SYSTEM';
const email = 'owner@system.com';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
const password = 'Password123!';

export class PlatformSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    try {
      // 시스템 유저 및 조직 생성
      const { owner, org } = await this.findSystemEntities(em);
      await this.linkOwnerToOrganization(em, owner, org);

      // 시스템 약관 생성
      await this.seedTerms(em);
      await em.flush();

      console.log(`✅ 시스템이 생성되었습니다.`);
    }
    catch (error) {
      console.error('❌ Seeder execution failed:', error);
      throw error;
    }
  }

  private async findSystemEntities(em: EntityManager) {
    const ownerBySystemRole = await em.findOne(User, {
      member: {
        role: RoleType.OWNER,
        organization: { metadata: { type: OrganizationType.PLATFORM } },
      },
    });
    const ownerByEmail = await em.findOne(User, { email });
    const org = await em.findOne(Organization, {
      metadata: { type: OrganizationType.PLATFORM },
    });
    return { owner: ownerBySystemRole ?? ownerByEmail, org };
  }

  private async linkOwnerToOrganization(
    em: EntityManager,
    owner: User | null,
    org: Organization | null,
  ) {
    let newOwner = owner;
    let newOrganization = org;

    if (!newOwner) {
      newOwner = em.create(User, {
        name,
        email,
        emailVerified: true,
      });
      console.log('✅ Owner Created');
    }

    if (newOwner) {
      const account = await em.findOne(Account, {
        user: newOwner,
        providerId: ProviderType.CREDENTIAL,
      });
      if (!account) {
        const passwordHash = bcrypt.hashSync(password, 10);
        em.create(Account, {
          user: newOwner,
          accountId: email,
          providerId: ProviderType.CREDENTIAL,
          password: passwordHash,
        });
        console.log('✅ Owner Account Created');
      }
    }

    if (!newOrganization) {
      newOrganization = em.create(Organization, {
        name: 'SYSTEM',
        slug: serial(),
        metadata: new OrganizationMetadata(OrganizationType.PLATFORM),
      });
      console.log('✅ System Organization Created');
    }

    // Member.user has unique constraint, so check membership by user first.
    if (newOwner && newOrganization) {
      const existingMember = await em.findOne(Member, { user: newOwner });

      if (!existingMember) {
        em.create(Member, {
          user: newOwner,
          organization: newOrganization,
          role: RoleType.OWNER,
        });
        console.log('✅ Linked Owner to Organization');
      }
      else {
        console.log('✅ Owner already linked to Organization');
      }
    }
  }

  private async seedTerms(em: EntityManager) {
    const terms = [
      {
        title: '서비스 이용약관',
        content: '서비스 이용약관 내용입니다.',
        version: '1.0.0',
        termType: TermType.REQUIRED,
      },
      {
        title: '개인정보 처리방침',
        content: '개인정보 처리방침 내용입니다.',
        version: '1.0.0',
        termType: TermType.REQUIRED,
      },
      {
        title: '마케팅 정보 수신 동의',
        content: '마케팅 정보 수신 동의 내용입니다.',
        version: '1.0.0',
        termType: TermType.OPTIONAL,
      },
    ];

    for (const termData of terms) {
      let termCategory = await em.findOne(TermCategory, { title: termData.title, organization: null });

      if (!termCategory) {
        termCategory = em.create(TermCategory, {
          title: termData.title,
          termType: termData.termType,
          isActive: true,
          organization: null,
        });
        console.log(`✅ Term Created: ${termData.title}`);
      }
      else {
        termCategory.title = termData.title;
        termCategory.termType = termData.termType;
      }

      const existingVersion = await em.findOne(Term, {
        category: termCategory,
        version: termData.version,
      });

      if (!existingVersion) {
        em.create(Term, {
          category: termCategory,
          content: termData.content,
          version: termData.version,
          startDate: new Date(),
          endDate: new Date('9999-12-31'),
        });
        console.log(`✅ TermVersion Created: ${termData.title} v${termData.version}`);
      }
      else {
        console.log(`✅ Term already exists: ${termData.title} (${termData.version})`);
      }
    }
  }
}
