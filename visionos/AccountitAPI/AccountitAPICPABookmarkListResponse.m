#import <AccountitAPI/AccountitAPICPABookmarkListResponse.h>

@implementation AccountitAPICPABookmarkItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)targetType {
    NSString *value = [self stringForKey:@"targetType"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)targetId {
    NSString *value = [self stringForKey:@"targetId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)targetTitle {
    NSString *value = [self stringForKey:@"targetTitle"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)targetSubtitle {
    return [self stringForKey:@"targetSubtitle"];
}

- (NSString * _Nonnull)createdAt {
    NSString *value = [self stringForKey:@"createdAt"];

    if (!value) {
        return @"";
    }

    return value;
}

@end

@implementation AccountitAPICPABookmarkListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPABookmarkItem class];
}

@end
