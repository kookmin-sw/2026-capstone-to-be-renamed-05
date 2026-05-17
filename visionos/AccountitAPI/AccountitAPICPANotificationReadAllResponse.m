#import <AccountitAPI/AccountitAPICPANotificationReadAllResponse.h>

@implementation AccountitAPICPANotificationReadAllResponse

- (NSInteger)updatedCount {
    NSNumber *number = [self numberForKey:@"updatedCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSInteger)unreadCount {
    NSNumber *number = [self numberForKey:@"unreadCount"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

@end
