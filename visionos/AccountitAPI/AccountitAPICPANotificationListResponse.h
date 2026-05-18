#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPANotificationItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *body;
@property (nonatomic, copy, readonly) NSString *href;
@property (nonatomic, copy, readonly, nullable) NSString *jobId;
@property (nonatomic, copy, readonly, nullable) NSString *labelId;
@property (nonatomic, copy, readonly, nullable) NSDictionary<NSString *, id> *metadata;
@property (nonatomic, copy, readonly, nullable) NSString *readAt;
@property (nonatomic, copy, readonly) NSString *createdAt;
@end

@interface AccountitAPICPANotificationListResponse : AccountitAPICollectionResponse

@property (nonatomic, assign, readonly) NSInteger unreadCount;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPANotificationItem *> *items;
@end

NS_ASSUME_NONNULL_END
