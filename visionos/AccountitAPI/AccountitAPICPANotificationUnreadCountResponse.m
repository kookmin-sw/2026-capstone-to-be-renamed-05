#import <AccountitAPI/AccountitAPICPANotificationUnreadCountResponse.h>

@implementation AccountitAPICPANotificationUnreadCountResponse

- (NSInteger)unreadCount {
    NSNumber *number = [self numberForKey:@"unreadCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

@end
