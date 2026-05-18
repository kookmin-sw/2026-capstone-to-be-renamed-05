#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPACommunityPostItem;

@interface AccountitAPICPACommunityAnswerItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *postId;
@property (nonatomic, copy, readonly) NSString *content;
@property (nonatomic, copy, readonly) NSString *authorName;
@property (nonatomic, copy, readonly, nullable) NSString *authorProfileImageUrl;
@property (nonatomic, assign, readonly, getter=isAnonymous) BOOL anonymous;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@property (nonatomic, assign, readonly) NSInteger likeCount;
@property (nonatomic, assign, readonly, getter=isAccepted) BOOL accepted;
@end

@interface AccountitAPICPACommunityPostDetailResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPACommunityPostItem *post;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPACommunityAnswerItem *> *answers;
@end

NS_ASSUME_NONNULL_END
