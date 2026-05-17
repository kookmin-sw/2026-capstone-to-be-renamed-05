#import <AccountitAPI/AccountitAPICPAHealthResponse.h>

@implementation AccountitAPICPAHealthResponse

- (BOOL)ok {
    return [self boolForKey:@"ok" defaultValue:NO];
}

- (NSString * _Nullable)service {
    return [self stringForKey:@"service"];
}

- (NSString * _Nullable)docs {
    return [self stringForKey:@"docs"];
}

- (NSString * _Nullable)area {
    return [self stringForKey:@"area"];
}

@end
