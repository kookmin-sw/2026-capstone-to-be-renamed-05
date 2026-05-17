#import <AccountitAPI/AccountitAPICPAJobCalendarResponse.h>
#import <AccountitAPI/AccountitAPICPAJobListResponse.h>

@implementation AccountitAPICPAJobCalendarDay

- (NSString * _Nonnull)date {
    NSString *value = [self stringForKey:@"date"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)total {
    NSNumber *number = [self numberForKey:@"total"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSArray<AccountitAPICPAJobListItem *> * _Nonnull)jobs {
    return (NSArray<AccountitAPICPAJobListItem *> *)[self arrayForKey:@"jobs" itemClass:[AccountitAPICPAJobListItem class]];
}

@end

@implementation AccountitAPICPAJobCalendarEvent

- (NSString * _Nonnull)date {
    NSString *value = [self stringForKey:@"date"];

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

- (AccountitAPICPAJobListItem * _Nonnull)job {
    AccountitAPICPAJobListItem *DTO = (AccountitAPICPAJobListItem *)[self DTOForKey:@"job" class:[AccountitAPICPAJobListItem class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPAJobListItem *emptyDTO = [[AccountitAPICPAJobListItem alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

@end

@implementation AccountitAPICPAJobCalendarRange

- (NSString * _Nonnull)startDate {
    NSString *value = [self stringForKey:@"startDate"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)endDate {
    return [self stringForKey:@"endDate"];
}

- (AccountitAPICPAJobListItem * _Nonnull)job {
    AccountitAPICPAJobListItem *DTO = (AccountitAPICPAJobListItem *)[self DTOForKey:@"job" class:[AccountitAPICPAJobListItem class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPAJobListItem *emptyDTO = [[AccountitAPICPAJobListItem alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

@end

@implementation AccountitAPICPAJobCalendarResponse

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

- (NSArray<AccountitAPICPAJobCalendarDay *> * _Nonnull)days {
    return (NSArray<AccountitAPICPAJobCalendarDay *> *)[self arrayForKey:@"days" itemClass:[AccountitAPICPAJobCalendarDay class]];
}

- (NSArray<AccountitAPICPAJobCalendarEvent *> * _Nonnull)events {
    return (NSArray<AccountitAPICPAJobCalendarEvent *> *)[self arrayForKey:@"events" itemClass:[AccountitAPICPAJobCalendarEvent class]];
}

- (NSArray<AccountitAPICPAJobCalendarRange *> * _Nonnull)ranges {
    return (NSArray<AccountitAPICPAJobCalendarRange *> *)[self arrayForKey:@"ranges" itemClass:[AccountitAPICPAJobCalendarRange class]];
}

@end
