#import <AccountitAPI/AccountitAPICPACompanyDashboardResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyProfileSubmissionListResponse.h>
#import <AccountitAPI/AccountitAPICPAJobListResponse.h>

@implementation AccountitAPICPAEmployeeTrendPoint

- (NSString * _Nonnull)month {
    NSString *value = [self stringForKey:@"month"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)joined {
    NSNumber *number = [self numberForKey:@"joined"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)left {
    NSNumber *number = [self numberForKey:@"left"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)total {
    NSNumber *number = [self numberForKey:@"total"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

@end

@implementation AccountitAPICPACompanyDetailItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)name {
    NSString *value = [self stringForKey:@"name"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)type {
    NSString *value = [self stringForKey:@"type"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)websiteUrl {
    return [self stringForKey:@"websiteUrl"];
}

- (NSString * _Nullable)logoUrl {
    return [self stringForKey:@"logoUrl"];
}

- (NSString * _Nullable)backgroundUrl {
    return [self stringForKey:@"backgroundUrl"];
}

- (NSString * _Nullable)description {
    return [self stringForKey:@"description"];
}

- (NSArray<NSString *> * _Nonnull)tags {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"tags"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSNumber * _Nullable)employeeCount {
    return [self numberForKey:@"employeeCount"];
}

- (NSNumber * _Nullable)averageSalary {
    return [self numberForKey:@"averageSalary"];
}

- (NSNumber * _Nullable)foundedYear {
    return [self numberForKey:@"foundedYear"];
}

- (NSNumber * _Nullable)recentAttritionRate {
    return [self numberForKey:@"recentAttritionRate"];
}

- (NSInteger)openJobCount {
    NSNumber *number = [self numberForKey:@"openJobCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSString * _Nullable)businessNumber {
    return [self stringForKey:@"businessNumber"];
}

- (NSArray<NSString *> * _Nonnull)externalLinks {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"externalLinks"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSArray<AccountitAPICPAEmployeeTrendPoint *> * _Nonnull)employeeTrend {
    return (NSArray<AccountitAPICPAEmployeeTrendPoint *> *)[self arrayForKey:@"employeeTrend" itemClass:[AccountitAPICPAEmployeeTrendPoint class]];
}

- (NSArray<AccountitAPICPAJobListItem *> * _Nonnull)openJobs {
    return (NSArray<AccountitAPICPAJobListItem *> *)[self arrayForKey:@"openJobs" itemClass:[AccountitAPICPAJobListItem class]];
}

@end

@implementation AccountitAPICPACompanyDashboardResponse

- (AccountitAPICPACompanyDetailItem * _Nonnull)company {
    AccountitAPICPACompanyDetailItem *DTO = (AccountitAPICPACompanyDetailItem *)[self DTOForKey:@"company" class:[AccountitAPICPACompanyDetailItem class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPACompanyDetailItem *emptyDTO = [[AccountitAPICPACompanyDetailItem alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (AccountitAPICPACompanyProfileSubmissionItem * _Nullable)pendingProfileSubmission {
    AccountitAPICPACompanyProfileSubmissionItem *DTO = (AccountitAPICPACompanyProfileSubmissionItem *)[self DTOForKey:@"pendingProfileSubmission" class:[AccountitAPICPACompanyProfileSubmissionItem class]];
    return DTO;
}

@end
