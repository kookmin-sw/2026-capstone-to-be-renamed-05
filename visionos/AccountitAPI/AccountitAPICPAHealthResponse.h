#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAHealthResponse : AccountitAPIDTO

@property (nonatomic, assign, readonly) BOOL ok;
@property (nonatomic, copy, readonly, nullable) NSString *service;
@property (nonatomic, copy, readonly, nullable) NSString *docs;
@property (nonatomic, copy, readonly, nullable) NSString *area;
@end

NS_ASSUME_NONNULL_END
