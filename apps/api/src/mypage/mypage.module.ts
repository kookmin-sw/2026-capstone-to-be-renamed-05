import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MypageController } from './mypage.controller';
import { MypageService } from './mypage.service';

@Module({
  imports: [AuthModule],
  controllers: [MypageController],
  providers: [MypageService],
})
export class MypageModule {}
