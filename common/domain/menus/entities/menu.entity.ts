import { Entity } from '../../base.entity';
import { DateUtil } from '@common/utils/date.util';

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
}

export enum MenuType {
  ROOT_MENU = 'ROOT_MENU',
  CUSTOM_MENU = 'CUSTOM_MENU',
}

export class Menu extends Entity {
  private constructor(
    id: string,
    private _action: string,
    private _deviceType: DeviceType,
    private _displayOrder: number,
    private _icon: string,
    private _name: string,
    private _sectionName?: string,
    private _tooltip?: string,
    private _type: MenuType = MenuType.ROOT_MENU,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
  ) {
    super(id, createdIn || DateUtil.now(), isActive !== undefined ? isActive : true, updatedIn || null);
  }

  static create(
    action: string,
    deviceType: DeviceType,
    displayOrder: number,
    icon: string,
    name: string,
    sectionName?: string,
    tooltip?: string,
    type: MenuType = MenuType.ROOT_MENU,
    id?: string,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
  ): Menu {
    return new Menu(
      id || '',
      action,
      deviceType,
      displayOrder,
      icon,
      name,
      sectionName,
      tooltip,
      type,
      createdIn,
      isActive,
      updatedIn,
    );
  }

  static fromDatabase(
    action: string,
    deviceType: DeviceType,
    displayOrder: number,
    icon: string,
    name: string,
    sectionName: string | undefined,
    tooltip: string | undefined,
    type: MenuType,
    id: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ): Menu {
    return new Menu(
      id,
      action,
      deviceType,
      displayOrder,
      icon,
      name,
      sectionName,
      tooltip,
      type,
      createdIn,
      isActive,
      updatedIn,
    );
  }

  get action(): string {
    return this._action;
  }

  get deviceType(): DeviceType {
    return this._deviceType;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  get icon(): string {
    return this._icon;
  }

  get name(): string {
    return this._name;
  }

  get sectionName(): string | undefined {
    return this._sectionName;
  }

  get tooltip(): string | undefined {
    return this._tooltip;
  }

  get type(): MenuType {
    return this._type;
  }

  updateAction(action: string): void {
    this._action = action;
    this.updateTimestamp();
  }

  updateDeviceType(deviceType: DeviceType): void {
    this._deviceType = deviceType;
    this.updateTimestamp();
  }

  updateDisplayOrder(displayOrder: number): void {
    this._displayOrder = displayOrder;
    this.updateTimestamp();
  }

  updateIcon(icon: string): void {
    this._icon = icon;
    this.updateTimestamp();
  }

  updateName(name: string): void {
    this._name = name;
    this.updateTimestamp();
  }

  updateSectionName(sectionName?: string): void {
    this._sectionName = sectionName;
    this.updateTimestamp();
  }

  updateTooltip(tooltip?: string): void {
    this._tooltip = tooltip;
    this.updateTimestamp();
  }

  updateType(type: MenuType): void {
    this._type = type;
    this.updateTimestamp();
  }
}



