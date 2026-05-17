#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPATagSubscriptionItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, copy, readonly, nullable) NSString *color;
@property (nonatomic, assign, readonly) BOOL subscribed;
@end

@interface AccountitAPICPATagSubscriptionListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPATagSubscriptionItem *> *items;
@end

NS_ASSUME_NONNULL_END
