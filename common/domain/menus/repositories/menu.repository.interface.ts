import { Menu } from '../entities/menu.entity';

export interface MenuRepository {
  findById(id: string): Promise<Menu | null>;
  findByDeviceType(deviceType: string): Promise<Menu[]>;
  save(menu: Menu): Promise<Menu>;
  update(menu: Menu): Promise<Menu>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Menu[]>;
}



