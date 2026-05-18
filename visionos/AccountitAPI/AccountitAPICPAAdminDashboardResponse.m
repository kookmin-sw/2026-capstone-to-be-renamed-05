#import <AccountitAPI/AccountitAPICPAAdminDashboardResponse.h>
#import <AccountitAPI/AccountitAPICPAAdminCompanyListResponse.h>
#import <AccountitAPI/AccountitAPICPAAdminJobListResponse.h>

@implementation AccountitAPICPAAdminDashboardResponse

- (NSDictionary<NSString *, id> * _Nonnull)counts {
    NSDictionary<NSString *, id> *dictionary = (NSDictionary<NSString *, id> *)[self dictionaryForKey:@"counts"];

    if (dictionary) {
        return dictionary;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    return [emptyDictionary autorelease];
}

- (NSArray<AccountitAPICPAAdminJobItem *> * _Nonnull)recentJobs {
    return (NSArray<AccountitAPICPAAdminJobItem *> *)[self arrayForKey:@"recentJobs" itemClass:[AccountitAPICPAAdminJobItem class]];
}

- (NSArray<AccountitAPICPAAdminCompanyItem *> * _Nonnull)recentCompanies {
    return (NSArray<AccountitAPICPAAdminCompanyItem *> *)[self arrayForKey:@"recentCompanies" itemClass:[AccountitAPICPAAdminCompanyItem class]];
}

@end
