#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAOpsDeployResponse : AccountitAPIDTO

@property (nonatomic, assign, readonly) BOOL ok;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, copy, readonly) NSString *branch;
@property (nonatomic, copy, readonly) NSString *sha;
@property (nonatomic, copy, readonly) NSString *logPath;
@end

NS_ASSUME_NONNULL_END
