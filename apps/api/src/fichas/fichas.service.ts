import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFichaDto, UpdateFichaDto } from './fichas.dto';

@Injectable()
export class FichasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.ficha.findMany({ orderBy: { criadoEm: 'asc' } });
  }

  async findOne(id: string) {
    const ficha = await this.prisma.ficha.findUnique({ where: { id } });
    if (!ficha) throw new NotFoundException('Ficha não encontrada');
    return ficha;
  }

  private async assertSistemas(ids: string[]) {
    const unicos = [...new Set(ids)];
    const achados = await this.prisma.sistema.count({ where: { id: { in: unicos } } });
    if (achados !== unicos.length) throw new BadRequestException('Sistema não encontrado');
  }

  async create(dto: CreateFichaDto) {
    await this.assertSistemas([dto.sistemaId]);
    return this.prisma.ficha.create({ data: dto as Prisma.FichaUncheckedCreateInput });
  }

  /** Cria várias fichas mantendo a ordem do array (criadoEm diferente por ficha). Ignora ids repetidos. */
  async createMany(dtos: CreateFichaDto[]) {
    await this.assertSistemas(dtos.map((d) => d.sistemaId));
    const base = Date.now();
    const data = dtos.map((dto, i) => ({ ...dto, criadoEm: new Date(base + i) })) as Prisma.FichaCreateManyInput[];
    const { count } = await this.prisma.ficha.createMany({ data, skipDuplicates: true });
    return { count };
  }

  async update(id: string, dto: UpdateFichaDto) {
    await this.findOne(id);
    return this.prisma.ficha.update({ where: { id }, data: dto as Prisma.FichaUncheckedUpdateInput });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.ficha.delete({ where: { id } });
  }

  async removeMany(onlyDemo: boolean) {
    const { count } = await this.prisma.ficha.deleteMany({ where: onlyDemo ? { demo: true } : {} });
    return { count };
  }
}
