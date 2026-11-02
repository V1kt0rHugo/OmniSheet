import { IsBoolean, IsNotEmpty, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class CreateFichaDto {
  /** O cliente pode gerar o id: o formato do fragmento no Hall deriva dele. */
  @IsOptional() @IsUUID() id?: string;
  @IsString() @IsNotEmpty() sistemaId: string;
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsString() epiteto?: string;
  @IsOptional() @IsString() campanha?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() resumo?: string;
  /** Valores dos campos do sistema, indexados pelo id do campo. */
  @IsOptional() @IsObject() dados?: Record<string, unknown>;
  @IsOptional() @IsObject() item?: { nome: string; descricao: string; imagem: string | null; tipo?: string };
  @IsOptional() @IsString() imagem?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(100) foco?: number;
  @IsOptional() @IsInt() @Min(0) @Max(360) cor?: number;
  @IsOptional() @IsBoolean() demo?: boolean;
}

export class UpdateFichaDto extends PartialType(OmitType(CreateFichaDto, ['id', 'sistemaId'] as const)) {}
