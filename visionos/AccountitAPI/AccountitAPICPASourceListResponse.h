#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPASourceItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, copy, readonly, nullable) NSString *baseUrl;
@property (nonatomic, copy, readonly, nullable) NSString *description;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@end

@interface AccountitAPICPASourceListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPASourceItem *> *items;
@end

NS_ASSUME_NONNULL_END
