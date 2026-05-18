#import <AccountitAPI/AccountitAPICPAMyCommunityActivityListResponse.h>

@implementation AccountitAPICPAMyCommunityActivityItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)boardType {
    NSString *value = [self stringForKey:@"boardType"];

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

- (NSInteger)commentCount {
    NSNumber *number = [self numberForKey:@"commentCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)likeCount {
    NSNumber *number = [self numberForKey:@"likeCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSString * _Nonnull)createdAt {
    NSString *value = [self stringForKey:@"createdAt"];

    if (!value) {
        return @"";
    }

    return value;
}

@end

@implementation AccountitAPICPAMyCommunityActivityListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAMyCommunityActivityItem class];
}

@end
