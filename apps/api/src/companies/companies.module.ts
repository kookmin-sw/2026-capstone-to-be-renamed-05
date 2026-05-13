import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompanyJobAutofillService } from './company-job-autofill.service';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyJobAutofillService],
})
export class CompaniesModule {}
