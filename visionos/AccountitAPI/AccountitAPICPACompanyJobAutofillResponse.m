#import <AccountitAPI/AccountitAPICPACompanyJobAutofillResponse.h>

@implementation AccountitAPICPACompanyJobAutofillDraft

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

- (NSString * _Nullable)originalUrl {
    return [self stringForKey:@"originalUrl"];
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

@end

@implementation AccountitAPICPACompanyJobAutofillResponse

- (AccountitAPICPACompanyJobAutofillDraft * _Nonnull)draft {
    AccountitAPICPACompanyJobAutofillDraft *DTO = (AccountitAPICPACompanyJobAutofillDraft *)[self DTOForKey:@"draft" class:[AccountitAPICPACompanyJobAutofillDraft class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPACompanyJobAutofillDraft *emptyDTO = [[AccountitAPICPACompanyJobAutofillDraft alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (NSArray<NSString *> * _Nonnull)warnings {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"warnings"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

@end
