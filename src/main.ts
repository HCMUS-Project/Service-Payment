import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    // Create a ConfigService instance
    const configService = new ConfigService();
    const port = configService.get<number>('PORT');
    const host = configService.get<String>('HOST');

    // Create a microservice instance
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        bufferLogs: true,
        options: {
            package: ['main', 'bank'],
            protoPath: join(__dirname, '../src/proto/main.proto'),
            url: `${host}:${port}`,
            loader: {
                enums: String,
                objects: true,
                arrays: true,
                includeDirs: [join(__dirname, '../src/proto/')],
            },
        },
    });

    // Start the microservice
    await app.listen();
}
bootstrap();
