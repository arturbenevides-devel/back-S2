import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MenuRepository as IMenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { Menu, DeviceType, MenuType } from '@common/domain/menus/entities/menu.entity';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class MenuRepository implements IMenuRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  private run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.runner.run(getRequiredTenantSchema(), fn);
  }

  async findById(id: string): Promise<Menu | null> {
    return this.run(async (tx) => {
      const menu = await tx.menu.findFirst({
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
    });
  }

  async findByDeviceType(deviceType: string): Promise<Menu[]> {
    return this.run(async (tx) => {
      const menus = await tx.menu.findMany({
        where: {
          deviceType,
          isActive: true,
        },
        orderBy: { displayOrder: 'asc' },
      });

      return menus.map((menu) =>
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
    });
  }

  async save(menu: Menu): Promise<Menu> {
    return this.run(async (tx) => {
      const createdMenu = await tx.menu.create({
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
    });
  }

  async update(menu: Menu): Promise<Menu> {
    return this.run(async (tx) => {
      await tx.menu.update({
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
    });
  }

  async delete(id: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.menu.delete({
        where: { id },
      });
    });
  }

  async findAll(): Promise<Menu[]> {
    return this.run(async (tx) => {
      const menus = await tx.menu.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });

      return menus.map((menu) =>
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
    });
  }
}
