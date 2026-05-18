#import <AccountitAPI/AccountitAPICPAOkResponse.h>

@implementation AccountitAPICPAOkResponse

- (BOOL)ok {
    return [self boolForKey:@"ok" defaultValue:NO];
}

@end
