#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPABookmarkItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *targetType;
@property (nonatomic, copy, readonly) NSString *targetId;
@property (nonatomic, copy, readonly) NSString *targetTitle;
@property (nonatomic, copy, readonly, nullable) NSString *targetSubtitle;
@property (nonatomic, copy, readonly) NSString *createdAt;
@end

@interface AccountitAPICPABookmarkListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPABookmarkItem *> *items;
@end

NS_ASSUME_NONNULL_END
