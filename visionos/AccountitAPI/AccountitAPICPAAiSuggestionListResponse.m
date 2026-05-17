#import <AccountitAPI/AccountitAPICPAAiSuggestionListResponse.h>

@implementation AccountitAPICPAAiSuggestionItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)jobId {
    NSString *value = [self stringForKey:@"jobId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)jobTitle {
    NSString *value = [self stringForKey:@"jobTitle"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)summary {
    NSString *value = [self stringForKey:@"summary"];

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

- (NSArray<NSString *> * _Nonnull)risks {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"risks"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSString * _Nonnull)status {
    NSString *value = [self stringForKey:@"status"];

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

@implementation AccountitAPICPAAiSuggestionListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAAiSuggestionItem class];
}

@end
