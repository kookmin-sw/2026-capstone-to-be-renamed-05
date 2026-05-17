#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAUserJobPresetItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *filterState;
@property (nonatomic, copy, readonly) NSString *autoLabel;
@property (nonatomic, copy, readonly) NSString *filterSignature;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@property (nonatomic, copy, readonly, nullable) NSString *lastUsedAt;
@end

@interface AccountitAPICPAUserJobPresetListResponse : AccountitAPICollectionResponse

@property (nonatomic, assign, readonly) BOOL authenticated;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAUserJobPresetItem *> *items;
@end

NS_ASSUME_NONNULL_END
