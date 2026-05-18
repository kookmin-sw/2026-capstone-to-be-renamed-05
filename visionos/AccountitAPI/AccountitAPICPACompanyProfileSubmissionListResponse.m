#import <AccountitAPI/AccountitAPICPACompanyProfileSubmissionListResponse.h>

@implementation AccountitAPICPACompanyProfileProposal

- (NSString * _Nullable)name {
    return [self stringForKey:@"name"];
}

- (NSString * _Nullable)type {
    return [self stringForKey:@"type"];
}

- (NSString * _Nullable)websiteUrl {
    return [self stringForKey:@"websiteUrl"];
}

- (NSString * _Nullable)description {
    return [self stringForKey:@"description"];
}

- (NSString * _Nullable)businessNumber {
    return [self stringForKey:@"businessNumber"];
}

- (NSArray<NSString *> * _Nullable)externalLinks {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"externalLinks"];
    return array;
}

- (NSArray<NSString *> * _Nullable)tags {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"tags"];
    return array;
}

@end

@implementation AccountitAPICPACompanyProfileSubmissionItem

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

- (AccountitAPICPACompanyProfileProposal * _Nonnull)proposed {
    AccountitAPICPACompanyProfileProposal *DTO = (AccountitAPICPACompanyProfileProposal *)[self DTOForKey:@"proposed" class:[AccountitAPICPACompanyProfileProposal class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPACompanyProfileProposal *emptyDTO = [[AccountitAPICPACompanyProfileProposal alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
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

@implementation AccountitAPICPACompanyProfileSubmissionListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPACompanyProfileSubmissionItem class];
}

@end
