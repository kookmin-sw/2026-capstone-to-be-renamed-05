#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPACommunityPostItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *boardType;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *content;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, copy, readonly) NSArray<NSString *> *tags;
@property (nonatomic, copy, readonly) NSString *authorName;
@property (nonatomic, copy, readonly, nullable) NSString *authorProfileImageUrl;
@property (nonatomic, assign, readonly, getter=isAnonymous) BOOL anonymous;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@property (nonatomic, assign, readonly) NSInteger viewCount;
@property (nonatomic, assign, readonly) NSInteger commentCount;
@property (nonatomic, assign, readonly) NSInteger likeCount;
@property (nonatomic, assign, readonly, getter=isResolved) BOOL resolved;
@property (nonatomic, copy, readonly, nullable) NSString *acceptedAnswerId;
@end

@interface AccountitAPICPACommunityPostListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPACommunityPostItem *> *items;
@end

NS_ASSUME_NONNULL_END
