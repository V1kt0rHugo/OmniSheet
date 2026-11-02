import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FichasModule } from './fichas/fichas.module';
import { SistemasModule } from './sistemas/sistemas.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, SistemasModule, FichasModule],
})
export class AppModule {}
