#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAMyCommunityActivityItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *boardType;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, assign, readonly) NSInteger commentCount;
@property (nonatomic, assign, readonly) NSInteger likeCount;
@property (nonatomic, copy, readonly) NSString *createdAt;
@end

@interface AccountitAPICPAMyCommunityActivityListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAMyCommunityActivityItem *> *items;
@end

NS_ASSUME_NONNULL_END
