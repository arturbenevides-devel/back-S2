import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MenuRepository as IMenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { Menu, DeviceType, MenuType } from '@common/domain/menus/entities/menu.entity';

@Injectable()
export class MenuRepository implements IMenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Menu | null> {
    const menu = await this.prisma.menu.findFirst({
      where: { 
        id,
        isActive: true,
      },
    });

    if (!menu) {
      return null;
    }

    return Menu.fromDatabase(
      menu.action,
      menu.deviceType as DeviceType,
      menu.displayOrder,
      menu.icon,
      menu.name,
      menu.sectionName || undefined,
      menu.tooltip || undefined,
      menu.type as MenuType,
      menu.id,
      menu.createdIn,
      menu.isActive,
      menu.updatedIn,
    );
  }

  async findByDeviceType(deviceType: string): Promise<Menu[]> {
    const menus = await this.prisma.menu.findMany({
      where: { 
        deviceType,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return menus.map(menu =>
      Menu.fromDatabase(
        menu.action,
        menu.deviceType as DeviceType,
        menu.displayOrder,
        menu.icon,
        menu.name,
        menu.sectionName || undefined,
        menu.tooltip || undefined,
        menu.type as MenuType,
        menu.id,
        menu.createdIn,
        menu.isActive,
        menu.updatedIn,
      ),
    );
  }

  async save(menu: Menu): Promise<Menu> {
    const createdMenu = await this.prisma.menu.create({
      data: {
        action: menu.action,
        deviceType: menu.deviceType,
        displayOrder: menu.displayOrder,
        icon: menu.icon,
        name: menu.name,
        sectionName: menu.sectionName,
        tooltip: menu.tooltip,
        type: menu.type,
        createdIn: menu.createdIn,
        isActive: menu.isActive,
        updatedIn: menu.updatedIn,
      },
    });

    return Menu.fromDatabase(
      createdMenu.action,
      createdMenu.deviceType as DeviceType,
      createdMenu.displayOrder,
      createdMenu.icon,
      createdMenu.name,
      createdMenu.sectionName || undefined,
      createdMenu.tooltip || undefined,
      createdMenu.type as MenuType,
      createdMenu.id,
      createdMenu.createdIn,
      createdMenu.isActive,
      createdMenu.updatedIn,
    );
  }

  async update(menu: Menu): Promise<Menu> {
    await this.prisma.menu.update({
      where: { id: menu.id },
      data: {
        action: menu.action,
        deviceType: menu.deviceType,
        displayOrder: menu.displayOrder,
        icon: menu.icon,
        name: menu.name,
        sectionName: menu.sectionName,
        tooltip: menu.tooltip,
        type: menu.type,
        isActive: menu.isActive,
        updatedIn: menu.updatedIn,
      },
    });

    return menu;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.menu.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Menu[]> {
    const menus = await this.prisma.menu.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return menus.map(menu =>
      Menu.fromDatabase(
        menu.action,
        menu.deviceType as DeviceType,
        menu.displayOrder,
        menu.icon,
        menu.name,
        menu.sectionName || undefined,
        menu.tooltip || undefined,
        menu.type as MenuType,
        menu.id,
        menu.createdIn,
        menu.isActive,
        menu.updatedIn,
      ),
    );
  }
}


