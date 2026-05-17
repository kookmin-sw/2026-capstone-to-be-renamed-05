#import <AccountitAPI/AccountitAPICPANotificationListResponse.h>

@implementation AccountitAPICPANotificationItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)type {
    NSString *value = [self stringForKey:@"type"];

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

- (NSString * _Nonnull)body {
    NSString *value = [self stringForKey:@"body"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)href {
    NSString *value = [self stringForKey:@"href"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)jobId {
    return [self stringForKey:@"jobId"];
}

- (NSString * _Nullable)labelId {
    return [self stringForKey:@"labelId"];
}

- (NSDictionary<NSString *, id> * _Nullable)metadata {
    NSDictionary<NSString *, id> *dictionary = (NSDictionary<NSString *, id> *)[self dictionaryForKey:@"metadata"];
    return dictionary;
}

- (NSString * _Nullable)readAt {
    return [self stringForKey:@"readAt"];
}

- (NSString * _Nonnull)createdAt {
    NSString *value = [self stringForKey:@"createdAt"];

    if (!value) {
        return @"";
    }

    return value;
}

@end

@implementation AccountitAPICPANotificationListResponse

@dynamic items;

- (NSInteger)unreadCount {
    NSNumber *number = [self numberForKey:@"unreadCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPANotificationItem class];
}

@end
