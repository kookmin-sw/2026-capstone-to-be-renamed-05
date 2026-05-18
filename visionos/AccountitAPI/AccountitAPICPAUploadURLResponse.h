#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAUploadURLResponse : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *assetId;
@property (nonatomic, copy, readonly) NSString *uploadUrl;
@property (nonatomic, copy, readonly) NSString *method;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, NSString *> *headers;
@property (nonatomic, copy, readonly) NSString *publicUrl;
@property (nonatomic, assign, readonly) NSInteger expiresIn;
@property (nonatomic, assign, readonly) BOOL requiresCredentials;
@end

NS_ASSUME_NONNULL_END
