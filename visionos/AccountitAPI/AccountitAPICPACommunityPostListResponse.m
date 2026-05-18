#import <AccountitAPI/AccountitAPICPACommunityPostListResponse.h>

@implementation AccountitAPICPACommunityPostItem

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

- (NSString * _Nonnull)content {
    NSString *value = [self stringForKey:@"content"];

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

- (NSArray<NSString *> * _Nonnull)tags {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"tags"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSString * _Nonnull)authorName {
    NSString *value = [self stringForKey:@"authorName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)authorProfileImageUrl {
    return [self stringForKey:@"authorProfileImageUrl"];
}

- (BOOL)isAnonymous {
    return [self boolForKey:@"isAnonymous" defaultValue:NO];
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

- (NSInteger)viewCount {
    NSNumber *number = [self numberForKey:@"viewCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
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

- (BOOL)isResolved {
    return [self boolForKey:@"isResolved" defaultValue:NO];
}

- (NSString * _Nullable)acceptedAnswerId {
    return [self stringForKey:@"acceptedAnswerId"];
}

@end

@implementation AccountitAPICPACommunityPostListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPACommunityPostItem class];
}

@end
