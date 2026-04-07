import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { type Term, TermCategoryRepository, TermRepository } from '@/entities';

import { CreateTermDto, UpdateTermDto } from './dto';

@Injectable()
export class TermsService {
  constructor(
    private readonly termRepository: TermCategoryRepository,
    private readonly termVersionRepository: TermRepository,
  ) { }

  async findAll(orgId?: string) {
    const versions = (await this.termVersionRepository.find({
      category: { organization: orgId ? { id: orgId } : null }, // Filter by organization if orgId is provided, else null for platform terms
    }, {
      populate: ['category'],
      orderBy: { createdAt: 'DESC' },
    })) as Term[];

    return versions.map((v) => ({
      id: v.category.id,
      versionId: v.id,
      title: v.category.title,
      content: v.content,
      version: v.version,
      termType: v.category.termType,
      isActive: v.category.isActive,
      startDate: v.startDate,
      endDate: v.endDate,
      updatedAt: v.updatedAt,
      createdAt: v.createdAt,
    }));
  }

  async create(organizationId: string | undefined, dto: CreateTermDto) {
    const em = this.termRepository.getEntityManager();

    let term = await this.termRepository.findOne({
      title: dto.title,
      organization: organizationId ? { id: organizationId } : null,
    });

    if (!term) {
      term = this.termRepository.create({
        title: dto.title,
        termType: dto.termType,
        organization: organizationId,
        isActive: dto.isActive ?? true,
      });
    }
    else {
      // 마스터 정보 갱신
      term.title = dto.title;
      term.termType = dto.termType;
      if (dto.isActive !== undefined) {
        term.isActive = dto.isActive;
      }
    }

    // 1-1. 버전 중복 체크
    if (term) {
      const existingVersion = await this.termVersionRepository.findOne({
        category: { id: term.id },
        version: dto.version,
      });

      if (existingVersion) {
        throw new ErrorException('TERM_VERSION_ALREADY_EXISTS', HttpStatus.BAD_REQUEST);
      }
    }

    // 2. 새 TermVersion 생성
    const version: Term = this.termVersionRepository.create({
      category: term,
      content: dto.content,
      version: dto.version,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate ? new Date(dto.endDate) : new Date('9999-12-31'),
    });

    return {
      id: term.id,
      title: term.title,
      content: version.content,
      version: version.version,
      termType: term.termType,
      isActive: term.isActive,
      startDate: version.startDate,
      endDate: version.endDate,
      updatedAt: version.updatedAt,
      createdAt: version.createdAt,
    };
  }

  async update(organizationId: string | undefined, termId: string, dto: UpdateTermDto) {
    const term = await this.termRepository.findOne({
      id: termId,
      organization: organizationId ? { id: organizationId } : null,
    }, { populate: ['terms'] });

    if (!term) {
      throw new ErrorException('TERM_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 마스터 정보 업데이트
    if (dto.title !== undefined) term.title = dto.title;
    if (dto.termType !== undefined) term.termType = dto.termType;
    if (dto.isActive !== undefined) term.isActive = dto.isActive;

    // 본문이나 버전이 직접 수정되는 경우 (가장 최근 버전을 수정)
    // 실제 운영 환경에서는 신규 버전을 생성하는 것이 권장되나, 현재 로직 대응을 위해 최신 버전 탐색
    const latestVersion = term.terms.getItems().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] as Term | undefined;

    if (latestVersion) {
      if (dto.content !== undefined) latestVersion.content = dto.content;
      if (dto.version !== undefined) latestVersion.version = dto.version;
      if (dto.startDate !== undefined) latestVersion.startDate = new Date(dto.startDate);
      if (dto.endDate !== undefined) latestVersion.endDate = new Date(dto.endDate);
    }

    return {
      id: term.id,
      versionId: latestVersion?.id || '',
      title: term.title,
      content: latestVersion?.content || '',
      version: latestVersion?.version || '',
      termType: term.termType,
      isActive: term.isActive,
      startDate: latestVersion?.startDate || term.createdAt,
      endDate: latestVersion?.endDate,
      updatedAt: term.updatedAt,
      createdAt: term.createdAt,
    };
  }
}
