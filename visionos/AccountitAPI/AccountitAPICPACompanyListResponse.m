#import <AccountitAPI/AccountitAPICPACompanyListResponse.h>

@implementation AccountitAPICPACompanyListItem

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

@end

@implementation AccountitAPICPACompanyListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPACompanyListItem class];
}

@end
