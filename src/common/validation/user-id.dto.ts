import { Matches } from 'class-validator';

export class UserIdParamDto {
  @Matches(/^[A-Za-z0-9_-]{1,64}$/, {
    message: 'userId must be 1-64 characters of letters, digits, "_" or "-"',
  })
  userId!: string;
}
