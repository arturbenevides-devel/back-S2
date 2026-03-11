import { Entity } from '../../base.entity';
import { DateUtil } from '@common/utils/date.util';

export class ProfilePermission extends Entity {
  private constructor(
    id: string,
    private _profileId: string,
    private _menuId: string | null,
    private _controller: string,
    private _canCreate: boolean,
    private _canUpdate: boolean,
    private _canDelete: boolean,
    private _canFind: boolean,
    private _canFindAll: boolean,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ) {
    super(id, createdIn, isActive, updatedIn);
  }

  static create(
    profileId: string,
    menuId: string | null,
    controller: string,
    canCreate: boolean,
    canUpdate: boolean,
    canDelete: boolean,
    canFind: boolean,
    canFindAll: boolean,
    id?: string,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
  ): ProfilePermission {
    return new ProfilePermission(
      id || '',
      profileId,
      menuId,
      controller,
      canCreate,
      canUpdate,
      canDelete,
      canFind,
      canFindAll,
      createdIn || DateUtil.now(),
      isActive !== undefined ? isActive : true,
      updatedIn || null,
    );
  }

  static fromDatabase(
    profileId: string,
    menuId: string | null,
    controller: string,
    canCreate: boolean,
    canUpdate: boolean,
    canDelete: boolean,
    canFind: boolean,
    canFindAll: boolean,
    id: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ): ProfilePermission {
    return new ProfilePermission(
      id,
      profileId,
      menuId,
      controller,
      canCreate,
      canUpdate,
      canDelete,
      canFind,
      canFindAll,
      createdIn,
      isActive,
      updatedIn,
    );
  }

  get profileId(): string {
    return this._profileId;
  }

  get menuId(): string | null {
    return this._menuId;
  }

  get controller(): string {
    return this._controller;
  }

  get canCreate(): boolean {
    return this._canCreate;
  }

  get canUpdate(): boolean {
    return this._canUpdate;
  }

  get canDelete(): boolean {
    return this._canDelete;
  }

  get canFind(): boolean {
    return this._canFind;
  }

  get canFindAll(): boolean {
    return this._canFindAll;
  }

  hasPermission(action: 'create' | 'update' | 'delete' | 'find' | 'findAll'): boolean {
    switch (action) {
      case 'create':
        return this._canCreate;
      case 'update':
        return this._canUpdate;
      case 'delete':
        return this._canDelete;
      case 'find':
        return this._canFind;
      case 'findAll':
        return this._canFindAll;
      default:
        return false;
    }
  }

  updatePermissions(
    canCreate: boolean,
    canUpdate: boolean,
    canDelete: boolean,
    canFind: boolean,
    canFindAll: boolean,
  ): void {
    this._canCreate = canCreate;
    this._canUpdate = canUpdate;
    this._canDelete = canDelete;
    this._canFind = canFind;
    this._canFindAll = canFindAll;
    this.updateTimestamp();
  }
}



