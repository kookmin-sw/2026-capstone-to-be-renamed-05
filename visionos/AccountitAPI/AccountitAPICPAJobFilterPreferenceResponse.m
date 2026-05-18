#import <AccountitAPI/AccountitAPICPAJobFilterPreferenceResponse.h>

@implementation AccountitAPICPAJobFilterPreferenceResponse

- (NSDictionary<NSString *, id> * _Nullable)filter {
    NSDictionary<NSString *, id> *dictionary = (NSDictionary<NSString *, id> *)[self dictionaryForKey:@"filter"];
    return dictionary;
}

- (BOOL)authenticated {
    return [self boolForKey:@"authenticated" defaultValue:NO];
}

@end
