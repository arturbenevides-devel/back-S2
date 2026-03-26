import { SetMetadata } from '@nestjs/common';

export enum SystemRole {
  OWNER = 'OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  USER = 'USER',
}

export const OWNER_SENTINEL = '__owner__';

export interface AccessControlOptions {
  roles?: SystemRole[];
  permissions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    find?: boolean;
    findAll?: boolean;
  };
}

export const AccessControl = (options: AccessControlOptions) => SetMetadata('access-control', options);



