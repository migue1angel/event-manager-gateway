import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/services';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { firstValueFrom } from 'rxjs';
import { Response } from 'express';

@Controller('orders')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrdersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      const result = await firstValueFrom(
        this.client.send('createOrder', createOrderDto),
      );

      return result;
    } catch (error) {
      console.error('Gateway Error:', error);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Failed to create order',
        error: 'Bad Request',
      };
    }
  }

  @Get()
  async findAll() {
    try {
      const result = await firstValueFrom(
        this.client.send('findAllOrders', {}),
      );
      return result;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch orders',
        error: 'Internal Server Error',
      };
    }
  }

  @Get('user/:id')
  async findByUser(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.client.send('findOrdersByUser', id),
      );
      return result;
    } catch (error) {
      console.error(error);
      throw new RpcException(error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(this.client.send('findOneOrder', id));
      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Order with ID ${id} not found`,
        error: 'Not Found',
      };
    }
  }

  @Get('generate-tickets/:id')
  async generateTickets(
    @Param('id') id: string, 
    @Res() res: Response
  ) {
    try {
      const result = await firstValueFrom(
        this.client.send('generateTickets', id),
      );
  
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=ticket.pdf'
      });
      
      res.send(Buffer.from(result));
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    try {
      const result = await firstValueFrom(
        this.client.send('updateOrder', { id, ...updateOrderDto }),
      );
      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to update order',
        error: 'Bad Request',
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(this.client.send('removeOrder', id));
      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Order with ID ${id} not found`,
        error: 'Not Found',
      };
    }
  }
}
