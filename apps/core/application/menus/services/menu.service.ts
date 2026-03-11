import { Injectable } from '@nestjs/common';
import { GetAuthorizedMenusUseCase } from '../use-cases/get-authorized-menus.use-case';
import { CreateMenuUseCase } from '../use-cases/create-menu.use-case';
import { MenuResponseDto } from '../dto/menu-response.dto';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { DeviceType, Menu } from '@common/domain/menus/entities/menu.entity';

@Injectable()
export class MenuService {
  constructor(
    private readonly getAuthorizedMenusUseCase: GetAuthorizedMenusUseCase,
    private readonly createMenuUseCase: CreateMenuUseCase,
  ) {}

  async getAuthorizedMenus(deviceType: DeviceType, profileId: string): Promise<MenuResponseDto[]> {
    return this.getAuthorizedMenusUseCase.execute(deviceType, profileId);
  }

  async createMenu(createMenuDto: CreateMenuDto): Promise<Menu[]> {
    return this.createMenuUseCase.execute(createMenuDto);
  }
}






