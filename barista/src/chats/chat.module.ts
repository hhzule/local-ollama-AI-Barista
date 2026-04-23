import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatsController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schema/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  providers: [ChatService],
  controllers: [ChatsController],
})
export class ChatsModule {}