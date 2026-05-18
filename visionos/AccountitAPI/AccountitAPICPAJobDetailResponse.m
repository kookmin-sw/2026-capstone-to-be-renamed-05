#import <AccountitAPI/AccountitAPICPAJobDetailResponse.h>
#import <AccountitAPI/AccountitAPICPAJobListResponse.h>

@implementation AccountitAPICPAJobDetailResponse

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

- (NSNumber * _Nullable)companyAverageSalary {
    return [self numberForKey:@"companyAverageSalary"];
}

- (NSString * _Nullable)companyLogoUrl {
    return [self stringForKey:@"companyLogoUrl"];
}

- (NSString * _Nullable)companyBackgroundUrl {
    return [self stringForKey:@"companyBackgroundUrl"];
}

- (NSString * _Nonnull)companyType {
    NSString *value = [self stringForKey:@"companyType"];

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

- (NSNumber * _Nullable)dDay {
    return [self numberForKey:@"dDay"];
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

- (NSString * _Nonnull)createdAt {
    NSString *value = [self stringForKey:@"createdAt"];

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

- (NSArray<NSString *> * _Nonnull)labels {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"labels"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSString * _Nonnull)description {
    NSString *value = [self stringForKey:@"description"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)aiSummary {
    return [self stringForKey:@"aiSummary"];
}

- (AccountitAPICPAJobAiSuggestion * _Nullable)aiSuggestion {
    AccountitAPICPAJobAiSuggestion *DTO = (AccountitAPICPAJobAiSuggestion *)[self DTOForKey:@"aiSuggestion" class:[AccountitAPICPAJobAiSuggestion class]];
    return DTO;
}

@end
