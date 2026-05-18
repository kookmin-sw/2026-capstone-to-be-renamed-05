#import <AccountitAPI/AccountitAPICPAAuthUserResponse.h>

@implementation AccountitAPICPASafeUser

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

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

- (NSString * _Nullable)profileImageUrl {
    return [self stringForKey:@"profileImageUrl"];
}

- (NSString * _Nonnull)role {
    NSString *value = [self stringForKey:@"role"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)companyId {
    return [self stringForKey:@"companyId"];
}

@end

@implementation AccountitAPICPAAuthUserResponse

- (AccountitAPICPASafeUser * _Nonnull)user {
    AccountitAPICPASafeUser *DTO = (AccountitAPICPASafeUser *)[self DTOForKey:@"user" class:[AccountitAPICPASafeUser class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPASafeUser *emptyDTO = [[AccountitAPICPASafeUser alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (NSString * _Nonnull)accessToken {
    NSString *value = [self stringForKey:@"accessToken"];

    if (!value) {
        return @"";
    }

    return value;
}

@end
