#import <AccountitAPI/AccountitAPICPASourceListResponse.h>

@implementation AccountitAPICPASourceItem

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

- (NSString * _Nullable)baseUrl {
    return [self stringForKey:@"baseUrl"];
}

- (NSString * _Nullable)description {
    return [self stringForKey:@"description"];
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

@implementation AccountitAPICPASourceListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPASourceItem class];
}

@end
