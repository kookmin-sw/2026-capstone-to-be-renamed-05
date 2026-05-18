#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAAssetItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *publicUrl;
@end

@interface AccountitAPICPAAssetCompletionResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPAAssetItem *asset;
@end

NS_ASSUME_NONNULL_END
