#import <AccountitAPI/AccountitAPICPAResumeListResponse.h>

@implementation AccountitAPICPAResumeItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)fileName {
    NSString *value = [self stringForKey:@"fileName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)fileUrl {
    NSString *value = [self stringForKey:@"fileUrl"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)contentType {
    NSString *value = [self stringForKey:@"contentType"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)byteSize {
    NSNumber *number = [self numberForKey:@"byteSize"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (BOOL)isPrimary {
    return [self boolForKey:@"isPrimary" defaultValue:NO];
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

@implementation AccountitAPICPAResumeListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAResumeItem class];
}

@end
