import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        return {
          uri,
          connectionFactory: (connection: Connection) => {
            const connectionState = Number(connection.readyState);
            if (connectionState === 1) {
              console.log('✅ MongoDB connected successfully');
            }
            return connection;
          },
        };
      },
      inject: [ConfigService], 
    }),
    AuthModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
