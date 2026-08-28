import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @Matches(/\S/, { message: 'Title cannot contain only spaces' })
  @MaxLength(200, { message: 'Title cannot be longer than 200 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Description cannot be longer than 1000 characters',
  })
  description?: string;
}
