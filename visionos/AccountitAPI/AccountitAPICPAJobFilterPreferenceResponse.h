#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAJobFilterPreferenceResponse : AccountitAPIDTO

@property (nonatomic, copy, readonly, nullable) NSDictionary<NSString *, id> *filter;
@property (nonatomic, assign, readonly) BOOL authenticated;
@end

NS_ASSUME_NONNULL_END
