#import <AccountitAPI/AccountitAPICPAUserJobPresetListResponse.h>

@implementation AccountitAPICPAUserJobPresetItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSDictionary<NSString *, id> * _Nonnull)filterState {
    NSDictionary<NSString *, id> *dictionary = (NSDictionary<NSString *, id> *)[self dictionaryForKey:@"filterState"];

    if (dictionary) {
        return dictionary;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    return [emptyDictionary autorelease];
}

- (NSString * _Nonnull)autoLabel {
    NSString *value = [self stringForKey:@"autoLabel"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)filterSignature {
    NSString *value = [self stringForKey:@"filterSignature"];

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

- (NSString * _Nullable)lastUsedAt {
    return [self stringForKey:@"lastUsedAt"];
}

@end

@implementation AccountitAPICPAUserJobPresetListResponse

@dynamic items;

- (BOOL)authenticated {
    return [self boolForKey:@"authenticated" defaultValue:NO];
}

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAUserJobPresetItem class];
}

@end
