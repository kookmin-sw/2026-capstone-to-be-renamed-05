#import <AccountitAPI/AccountitAPICPAAdminMemberListResponse.h>

@implementation AccountitAPICPAAdminMemberItem

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

- (NSString * _Nonnull)role {
    NSString *value = [self stringForKey:@"role"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)accountStatus {
    NSString *value = [self stringForKey:@"accountStatus"];

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

@implementation AccountitAPICPAAdminMemberListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAAdminMemberItem class];
}

@end
