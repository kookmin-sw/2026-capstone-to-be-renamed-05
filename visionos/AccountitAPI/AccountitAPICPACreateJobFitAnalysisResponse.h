#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAJobFitAnalysisItem;

@interface AccountitAPICPACreateJobFitAnalysisResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPAJobFitAnalysisItem *item;
@property (nonatomic, assign, readonly) BOOL reused;
@end

NS_ASSUME_NONNULL_END
