#import <AccountitAPI/AccountitAPICPAPersonalVerificationRequestListResponse.h>

@implementation AccountitAPICPAPersonalVerificationRequestItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)userId {
    NSString *value = [self stringForKey:@"userId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)username {
    NSString *value = [self stringForKey:@"username"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)displayName {
    return [self stringForKey:@"displayName"];
}

- (NSString * _Nonnull)applicantName {
    NSString *value = [self stringForKey:@"applicantName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)birthDate {
    return [self stringForKey:@"birthDate"];
}

- (NSString * _Nullable)registrationNumber {
    return [self stringForKey:@"registrationNumber"];
}

- (NSString * _Nullable)registrationNumberLast4 {
    return [self stringForKey:@"registrationNumberLast4"];
}

- (NSString * _Nonnull)requestedCareerStage {
    NSString *value = [self stringForKey:@"requestedCareerStage"];

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

- (NSString * _Nullable)adminNote {
    return [self stringForKey:@"adminNote"];
}

- (NSString * _Nullable)reviewedByUsername {
    return [self stringForKey:@"reviewedByUsername"];
}

- (NSString * _Nullable)reviewedAt {
    return [self stringForKey:@"reviewedAt"];
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

@implementation AccountitAPICPAPersonalVerificationRequestListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAPersonalVerificationRequestItem class];
}

@end
