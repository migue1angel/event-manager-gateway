import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [EventController],
  providers: [EventService],
  imports: [NatsModule],
})
export class EventModule {}
