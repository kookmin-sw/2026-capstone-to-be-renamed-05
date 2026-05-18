#import <AccountitAPI/AccountitAPICPAUploadURLResponse.h>

@implementation AccountitAPICPAUploadURLResponse

- (NSString * _Nonnull)assetId {
    NSString *value = [self stringForKey:@"assetId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)uploadUrl {
    NSString *value = [self stringForKey:@"uploadUrl"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)method {
    NSString *value = [self stringForKey:@"method"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSDictionary<NSString *, NSString *> * _Nonnull)headers {
    NSDictionary<NSString *, NSString *> *dictionary = (NSDictionary<NSString *, NSString *> *)[self dictionaryForKey:@"headers"];

    if (dictionary) {
        return dictionary;
    }

    NSDictionary<NSString *, NSString *> *emptyDictionary = [[NSDictionary alloc] init];
    return [emptyDictionary autorelease];
}

- (NSString * _Nonnull)publicUrl {
    NSString *value = [self stringForKey:@"publicUrl"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)expiresIn {
    NSNumber *number = [self numberForKey:@"expiresIn"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (BOOL)requiresCredentials {
    return [self boolForKey:@"requiresCredentials" defaultValue:NO];
}

@end
