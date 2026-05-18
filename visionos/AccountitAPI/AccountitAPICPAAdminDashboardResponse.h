#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAAdminJobItem;
@class AccountitAPICPAAdminCompanyItem;

@interface AccountitAPICPAAdminDashboardResponse : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *counts;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAAdminJobItem *> *recentJobs;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAAdminCompanyItem *> *recentCompanies;
@end

NS_ASSUME_NONNULL_END
