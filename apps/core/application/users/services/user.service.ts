import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { GetUserUseCase } from '../use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { UpdateMyProfileUseCase } from '../use-cases/update-my-profile.use-case';
import { ChangePasswordUseCase } from '../use-cases/change-password.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';
import { ListUsersUseCase } from '../use-cases/list-users.use-case';
import { UpdateUserStatusUseCase } from '../use-cases/update-user-status.use-case';
import { SetMyPasswordUseCase } from '../use-cases/set-my-password.use-case';
import { ResetUserPasswordUseCase } from '../use-cases/reset-user-password.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { SetMyPasswordDto } from '../dto/set-my-password.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly setMyPasswordUseCase: SetMyPasswordUseCase,
    private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(createUserDto);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return this.getUserUseCase.execute(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(id, updateUserDto);
  }

  async updateMyProfile(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.updateMyProfileUseCase.execute(userId, updateUserDto);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    return this.changePasswordUseCase.execute(userId, changePasswordDto);
  }

  async remove(id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }

  async findAll(excludeUserId?: string): Promise<UserResponseDto[]> {
    return this.listUsersUseCase.execute(excludeUserId);
  }

  async updateStatus(userId: string, isActive: boolean): Promise<{ id: string; isActive: boolean }> {
    return this.updateUserStatusUseCase.execute(userId, isActive);
  }

  async setMyPassword(userId: string, dto: SetMyPasswordDto): Promise<void> {
    return this.setMyPasswordUseCase.execute(userId, dto);
  }

  async resetUserPassword(userId: string): Promise<{ message: string }> {
    return this.resetUserPasswordUseCase.execute(userId);
  }
}






