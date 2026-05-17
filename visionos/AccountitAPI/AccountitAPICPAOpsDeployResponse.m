#import <AccountitAPI/AccountitAPICPAOpsDeployResponse.h>

@implementation AccountitAPICPAOpsDeployResponse

- (BOOL)ok {
    return [self boolForKey:@"ok" defaultValue:NO];
}

- (NSString * _Nonnull)status {
    NSString *value = [self stringForKey:@"status"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)branch {
    NSString *value = [self stringForKey:@"branch"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)sha {
    NSString *value = [self stringForKey:@"sha"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)logPath {
    NSString *value = [self stringForKey:@"logPath"];

    if (!value) {
        return @"";
    }

    return value;
}

@end
