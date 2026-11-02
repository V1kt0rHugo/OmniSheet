import { Body, Controller, Delete, Get, HttpCode, Param, ParseArrayPipe, Patch, Post, Query } from '@nestjs/common';
import { FichasService } from './fichas.service';
import { CreateFichaDto, UpdateFichaDto } from './fichas.dto';

@Controller('fichas')
export class FichasController {
  constructor(private readonly fichas: FichasService) {}

  @Get() findAll() { return this.fichas.findAll(); }
  @Post() create(@Body() dto: CreateFichaDto) { return this.fichas.create(dto); }

  @Post('bulk')
  createMany(@Body(new ParseArrayPipe({ items: CreateFichaDto })) dtos: CreateFichaDto[]) {
    return this.fichas.createMany(dtos);
  }

  /** Sem parâmetros apaga tudo; com `?demo=true` apaga só as fichas de exemplo. */
  @Delete() removeMany(@Query('demo') demo?: string) { return this.fichas.removeMany(demo === 'true'); }

  @Get(':id') findOne(@Param('id') id: string) { return this.fichas.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateFichaDto) { return this.fichas.update(id, dto); }
  @Delete(':id') @HttpCode(204) remove(@Param('id') id: string) { return this.fichas.remove(id); }
}
