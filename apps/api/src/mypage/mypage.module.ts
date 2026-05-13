import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { AuthModule } from '../auth/auth.module';
import { MypageController } from './mypage.controller';
import { MypageService } from './mypage.service';

@Module({
  imports: [AssetsModule, AuthModule],
  controllers: [MypageController],
  providers: [MypageService],
})
export class MypageModule {}
