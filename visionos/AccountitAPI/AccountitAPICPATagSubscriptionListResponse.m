#import <AccountitAPI/AccountitAPICPATagSubscriptionListResponse.h>

@implementation AccountitAPICPATagSubscriptionItem

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

- (NSString * _Nullable)color {
    return [self stringForKey:@"color"];
}

- (BOOL)subscribed {
    return [self boolForKey:@"subscribed" defaultValue:NO];
}

@end

@implementation AccountitAPICPATagSubscriptionListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPATagSubscriptionItem class];
}

@end
