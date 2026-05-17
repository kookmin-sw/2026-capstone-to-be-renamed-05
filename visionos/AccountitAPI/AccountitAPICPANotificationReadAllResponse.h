#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPANotificationReadAllResponse : AccountitAPIDTO

@property (nonatomic, assign, readonly) NSInteger updatedCount;
@property (nonatomic, assign, readonly) NSInteger unreadCount;
@end

NS_ASSUME_NONNULL_END
