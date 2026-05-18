#import <AccountitAPI/AccountitAPICPAJobSubmissionListResponse.h>

@implementation AccountitAPICPAJobSubmissionItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

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

- (NSString * _Nonnull)submissionType {
    NSString *value = [self stringForKey:@"submissionType"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)targetJobId {
    return [self stringForKey:@"targetJobId"];
}

- (NSString * _Nullable)targetJobTitle {
    return [self stringForKey:@"targetJobTitle"];
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

- (NSString * _Nonnull)status {
    NSString *value = [self stringForKey:@"status"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)adminNote {
    return [self stringForKey:@"adminNote"];
}

- (NSString * _Nullable)approvedJobId {
    return [self stringForKey:@"approvedJobId"];
}

- (NSString * _Nonnull)submittedByUsername {
    NSString *value = [self stringForKey:@"submittedByUsername"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)reviewedByUsername {
    return [self stringForKey:@"reviewedByUsername"];
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

- (NSString * _Nullable)reviewedAt {
    return [self stringForKey:@"reviewedAt"];
}

@end

@implementation AccountitAPICPAJobSubmissionListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAJobSubmissionItem class];
}

@end
