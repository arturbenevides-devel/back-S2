import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { MenuService } from '@apps/core/application/menus/services/menu.service';
import { MenuResponseDto } from '@apps/core/application/menus/dto/menu-response.dto';
import { CreateMenuDto } from '@apps/core/application/menus/dto/create-menu.dto';
import { DeviceType, Menu } from '@common/domain/menus/entities/menu.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { AdminOnly } from '@common/utils/decorators/admin-only.decorator';

@ApiTags('Menus')
@Controller('menu')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MenusController {
  constructor(private readonly menuService: MenuService) {}

  @Get('authorized/:deviceType')
  @ApiOperation({ summary: 'Buscar menus autorizados por tipo de dispositivo' })
  @ApiParam({
    name: 'deviceType',
    description: 'Tipo de dispositivo (MOBILE, WEB, TABLET)',
    enum: DeviceType,
    example: 'MOBILE',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de menus autorizados',
    type: [MenuResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Tipo de dispositivo inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  async getAuthorizedMenus(
    @Param('deviceType') deviceType: DeviceType,
    @Request() req: any,
  ): Promise<MenuResponseDto[]> {
    const profileId = req.user.profileId;
    return this.menuService.getAuthorizedMenus(deviceType, profileId);
  }

  @Post()
  @UseGuards(PermissionGuard)
  @AdminOnly()
  @ApiExcludeEndpoint()
  async createMenu(@Body() createMenuDto: CreateMenuDto): Promise<Menu[]> {
    return this.menuService.createMenu(createMenuDto);
  }
}



