#import <AccountitAPI/AccountitAPICPACommunityPostDetailResponse.h>
#import <AccountitAPI/AccountitAPICPACommunityPostListResponse.h>

@implementation AccountitAPICPACommunityAnswerItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)postId {
    NSString *value = [self stringForKey:@"postId"];

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

- (NSInteger)likeCount {
    NSNumber *number = [self numberForKey:@"likeCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (BOOL)isAccepted {
    return [self boolForKey:@"isAccepted" defaultValue:NO];
}

@end

@implementation AccountitAPICPACommunityPostDetailResponse

- (AccountitAPICPACommunityPostItem * _Nonnull)post {
    AccountitAPICPACommunityPostItem *DTO = (AccountitAPICPACommunityPostItem *)[self DTOForKey:@"post" class:[AccountitAPICPACommunityPostItem class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPACommunityPostItem *emptyDTO = [[AccountitAPICPACommunityPostItem alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (NSArray<AccountitAPICPACommunityAnswerItem *> * _Nonnull)answers {
    return (NSArray<AccountitAPICPACommunityAnswerItem *> *)[self arrayForKey:@"answers" itemClass:[AccountitAPICPACommunityAnswerItem class]];
}

@end
