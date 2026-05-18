#import <AccountitAPI/AccountitAPICPAAdminJobListResponse.h>

@implementation AccountitAPICPAAdminJobItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

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

- (NSString * _Nonnull)description {
    NSString *value = [self stringForKey:@"description"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)companyId {
    NSString *value = [self stringForKey:@"companyId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)companyName {
    NSString *value = [self stringForKey:@"companyName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)sourceId {
    NSString *value = [self stringForKey:@"sourceId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)sourceName {
    NSString *value = [self stringForKey:@"sourceName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)originalUrl {
    NSString *value = [self stringForKey:@"originalUrl"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)jobFamily {
    NSString *value = [self stringForKey:@"jobFamily"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)employmentType {
    NSString *value = [self stringForKey:@"employmentType"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)companyType {
    NSString *value = [self stringForKey:@"companyType"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)kicpaCondition {
    NSString *value = [self stringForKey:@"kicpaCondition"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)traineeStatus {
    NSString *value = [self stringForKey:@"traineeStatus"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSNumber * _Nullable)practicalTrainingInstitution {
    return [self numberForKey:@"practicalTrainingInstitution"];
}

- (NSNumber * _Nullable)minExperienceYears {
    return [self numberForKey:@"minExperienceYears"];
}

- (NSNumber * _Nullable)maxExperienceYears {
    return [self numberForKey:@"maxExperienceYears"];
}

- (NSString * _Nullable)location {
    return [self stringForKey:@"location"];
}

- (NSString * _Nonnull)deadlineType {
    NSString *value = [self stringForKey:@"deadlineType"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)deadline {
    return [self stringForKey:@"deadline"];
}

- (NSString * _Nonnull)status {
    NSString *value = [self stringForKey:@"status"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)lastCheckedAt {
    NSString *value = [self stringForKey:@"lastCheckedAt"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)createdAt {
    NSString *value = [self stringForKey:@"createdAt"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)updatedAt {
    NSString *value = [self stringForKey:@"updatedAt"];

    if (!value) {
        return @"";
    }

    return value;
}

@end

@implementation AccountitAPICPAAdminJobListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAAdminJobItem class];
}

@end
