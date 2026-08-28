import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      // Prisma translates this into a PostgreSQL SELECT query.
      return await this.prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findOne(id: number) {
    this.checkId(id);

    try {
      const task = await this.prisma.task.findUnique({ where: { id } });

      if (!task) {
        throw new NotFoundException(`Task ${id} was not found`);
      }

      return task;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async create(createTaskDto: CreateTaskDto) {
    try {
      return await this.prisma.task.create({
        data: {
          title: createTaskDto.title.trim(),
          description: createTaskDto.description?.trim() || null,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    this.checkId(id);

    try {
      // Updating zero rows should become an understandable 404 response.
      const existingTask = await this.prisma.task.findUnique({ where: { id } });
      if (!existingTask) {
        throw new NotFoundException(`Task ${id} was not found`);
      }

      return await this.prisma.task.update({
        where: { id },
        data: {
          ...updateTaskDto,
          ...(updateTaskDto.title !== undefined && {
            title: updateTaskDto.title.trim(),
          }),
          ...(updateTaskDto.description !== undefined && {
            description: updateTaskDto.description.trim() || null,
          }),
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: number) {
    this.checkId(id);

    try {
      const existingTask = await this.prisma.task.findUnique({ where: { id } });
      if (!existingTask) {
        throw new NotFoundException(`Task ${id} was not found`);
      }

      await this.prisma.task.delete({ where: { id } });
      return { message: `Task ${id} was deleted` };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private checkId(id: number) {
    if (id < 1) {
      throw new BadRequestException('Task ID must be a positive number');
    }
  }

  private handleDatabaseError(error: unknown): never {
    // Keep expected HTTP errors, such as 404, unchanged.
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new InternalServerErrorException(
        `Database request failed (${error.code})`,
      );
    }

    throw new InternalServerErrorException(
      'Database error. Check that PostgreSQL is running and configured correctly.',
    );
  }
}
