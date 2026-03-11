import { Injectable, Inject } from '@nestjs/common';
import { MenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { Menu, MenuType, DeviceType } from '@common/domain/menus/entities/menu.entity';

@Injectable()
export class CreateMenuUseCase {
  constructor(
    @Inject('MenuRepository')
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(createMenuDto: CreateMenuDto): Promise<Menu[]> {
    const savedMenus: Menu[] = [];

    // Se deviceType foi especificado, criar apenas para esse tipo
    if (createMenuDto.deviceType) {
      const menu = Menu.create(
        createMenuDto.action,
        createMenuDto.deviceType,
        createMenuDto.displayOrder,
        createMenuDto.icon,
        createMenuDto.name,
        createMenuDto.sectionName,
        createMenuDto.tooltip,
        createMenuDto.type || MenuType.ROOT_MENU,
      );

      const savedMenu = await this.menuRepository.save(menu);
      savedMenus.push(savedMenu);

      return savedMenus;
    }

    // Se deviceType não foi especificado, criar para ambos os tipos
    // Criar menu para DESKTOP
    const desktopMenu = Menu.create(
      createMenuDto.action,
      DeviceType.DESKTOP,
      createMenuDto.displayOrder,
      createMenuDto.icon,
      createMenuDto.name,
      createMenuDto.sectionName,
      createMenuDto.tooltip,
      createMenuDto.type || MenuType.ROOT_MENU,
    );

    const savedDesktopMenu = await this.menuRepository.save(desktopMenu);
    savedMenus.push(savedDesktopMenu);

    // Criar menu para MOBILE
    const mobileMenu = Menu.create(
      createMenuDto.action,
      DeviceType.MOBILE,
      createMenuDto.displayOrder,
      createMenuDto.icon,
      createMenuDto.name,
      createMenuDto.sectionName,
      createMenuDto.tooltip,
      createMenuDto.type || MenuType.ROOT_MENU,
    );

    const savedMobileMenu = await this.menuRepository.save(mobileMenu);
    savedMenus.push(savedMobileMenu);

    return savedMenus;
  }

}






