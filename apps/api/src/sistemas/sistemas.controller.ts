import { Controller, Get, Param } from '@nestjs/common';
import { SistemasService } from './sistemas.service';

/** Os sistemas vêm do código (`definicoes/`): a API só os lista. */
@Controller('sistemas')
export class SistemasController {
  constructor(private readonly sistemas: SistemasService) {}

  @Get() findAll() { return this.sistemas.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.sistemas.findOne(id); }
}
