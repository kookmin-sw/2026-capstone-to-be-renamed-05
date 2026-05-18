#import <AccountitAPI/AccountitAPICPACompanyAnalyticsDashboardResponse.h>

@implementation AccountitAPICPACompanyAnalyticsPeriod

- (NSString * _Nonnull)from {
    NSString *value = [self stringForKey:@"from"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)to {
    NSString *value = [self stringForKey:@"to"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)days {
    NSNumber *number = [self numberForKey:@"days"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

@end

@implementation AccountitAPICPACompanyAnalyticsSummary

- (NSInteger)detailViews {
    NSNumber *number = [self numberForKey:@"detailViews"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)originalClicks {
    NSNumber *number = [self numberForKey:@"originalClicks"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)bookmarkAdds {
    NSNumber *number = [self numberForKey:@"bookmarkAdds"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)bookmarkRemoves {
    NSNumber *number = [self numberForKey:@"bookmarkRemoves"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)currentBookmarks {
    NSNumber *number = [self numberForKey:@"currentBookmarks"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (double)originalClickRate {
    NSNumber *number = [self numberForKey:@"originalClickRate"];

    if (!number) {
        return 0.0;
    }

    return [number doubleValue];
}

- (double)bookmarkConversionRate {
    NSNumber *number = [self numberForKey:@"bookmarkConversionRate"];

    if (!number) {
        return 0.0;
    }

    return [number doubleValue];
}

@end

@implementation AccountitAPICPACompanyAnalyticsDailyPoint

- (NSString * _Nonnull)date {
    NSString *value = [self stringForKey:@"date"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)detailViews {
    NSNumber *number = [self numberForKey:@"detailViews"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)originalClicks {
    NSNumber *number = [self numberForKey:@"originalClicks"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)bookmarkAdds {
    NSNumber *number = [self numberForKey:@"bookmarkAdds"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

@end

@implementation AccountitAPICPACompanyAnalyticsJobItem

- (NSString * _Nonnull)jobId {
    NSString *value = [self stringForKey:@"jobId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)title {
    NSString *value = [self stringForKey:@"title"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)status {
    NSString *value = [self stringForKey:@"status"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)detailViews {
    NSNumber *number = [self numberForKey:@"detailViews"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)originalClicks {
    NSNumber *number = [self numberForKey:@"originalClicks"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)bookmarkAdds {
    NSNumber *number = [self numberForKey:@"bookmarkAdds"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)bookmarkRemoves {
    NSNumber *number = [self numberForKey:@"bookmarkRemoves"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)currentBookmarks {
    NSNumber *number = [self numberForKey:@"currentBookmarks"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (double)originalClickRate {
    NSNumber *number = [self numberForKey:@"originalClickRate"];

    if (!number) {
        return 0.0;
    }

    return [number doubleValue];
}

- (double)bookmarkConversionRate {
    NSNumber *number = [self numberForKey:@"bookmarkConversionRate"];

    if (!number) {
        return 0.0;
    }

    return [number doubleValue];
}

@end

@implementation AccountitAPICPACompanyAnalyticsDashboardResponse

- (AccountitAPICPACompanyAnalyticsPeriod * _Nonnull)period {
    AccountitAPICPACompanyAnalyticsPeriod *DTO = (AccountitAPICPACompanyAnalyticsPeriod *)[self DTOForKey:@"period" class:[AccountitAPICPACompanyAnalyticsPeriod class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPACompanyAnalyticsPeriod *emptyDTO = [[AccountitAPICPACompanyAnalyticsPeriod alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (AccountitAPICPACompanyAnalyticsSummary * _Nonnull)summary {
    AccountitAPICPACompanyAnalyticsSummary *DTO = (AccountitAPICPACompanyAnalyticsSummary *)[self DTOForKey:@"summary" class:[AccountitAPICPACompanyAnalyticsSummary class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPACompanyAnalyticsSummary *emptyDTO = [[AccountitAPICPACompanyAnalyticsSummary alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (NSArray<AccountitAPICPACompanyAnalyticsDailyPoint *> * _Nonnull)daily {
    return (NSArray<AccountitAPICPACompanyAnalyticsDailyPoint *> *)[self arrayForKey:@"daily" itemClass:[AccountitAPICPACompanyAnalyticsDailyPoint class]];
}

- (NSArray<AccountitAPICPACompanyAnalyticsJobItem *> * _Nonnull)jobs {
    return (NSArray<AccountitAPICPACompanyAnalyticsJobItem *> *)[self arrayForKey:@"jobs" itemClass:[AccountitAPICPACompanyAnalyticsJobItem class]];
}

- (NSString * _Nonnull)generatedAt {
    NSString *value = [self stringForKey:@"generatedAt"];

    if (!value) {
        return @"";
    }

    return value;
}

@end
