import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SISTEMAS, validarDefinicoes } from './definicoes';

@Injectable()
export class SistemasService implements OnModuleInit {
  private readonly log = new Logger(SistemasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Os sistemas são definidos no código. Ao iniciar, a API confere cada definição (um erro de digitação
   * derruba a inicialização com a mensagem do problema) e deixa o banco igual ao código.
   */
  async onModuleInit() {
    validarDefinicoes(SISTEMAS);

    for (const [i, s] of SISTEMAS.entries()) {
      const data = { nome: s.nome, descricao: s.descricao, secoes: s.secoes as unknown as Prisma.InputJsonValue, builtin: true };
      await this.prisma.sistema.upsert({
        where: { id: s.id },
        update: data,
        // criadoEm escalonado para os sistemas aparecerem sempre na ordem em que foram declarados
        create: { id: s.id, ...data, criadoEm: new Date(Date.UTC(2020, 0, 1, 0, 0, i)) },
      });
    }

    // sistema removido do código: some do banco, a não ser que ainda haja fichas usando
    const noCodigo = new Set(SISTEMAS.map((s) => s.id));
    for (const s of await this.prisma.sistema.findMany({ select: { id: true, nome: true } })) {
      if (noCodigo.has(s.id)) continue;
      const usos = await this.prisma.ficha.count({ where: { sistemaId: s.id } });
      if (usos) this.log.warn(`O sistema "${s.nome}" (${s.id}) saiu do código mas tem ${usos} ficha(s); mantido no banco.`);
      else await this.prisma.sistema.delete({ where: { id: s.id } });
    }
  }

  findAll() {
    return this.prisma.sistema.findMany({ orderBy: { criadoEm: 'asc' } });
  }

  async findOne(id: string) {
    const s = await this.prisma.sistema.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Sistema não encontrado');
    return s;
  }
}
