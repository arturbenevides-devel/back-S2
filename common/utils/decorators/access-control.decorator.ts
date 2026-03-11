import { SetMetadata } from '@nestjs/common';

export enum ProfileRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export interface AccessControlOptions {
  roles?: ProfileRole[];
  permissions?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    find?: boolean;
    findAll?: boolean;
  };
}

export const AccessControl = (options: AccessControlOptions) => SetMetadata('access-control', options);



