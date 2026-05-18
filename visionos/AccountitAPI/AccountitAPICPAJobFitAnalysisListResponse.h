#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAJobFitAnalysisItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *jobId;
@property (nonatomic, copy, readonly) NSString *jobTitle;
@property (nonatomic, copy, readonly) NSString *companyId;
@property (nonatomic, copy, readonly) NSString *companyName;
@property (nonatomic, copy, readonly) NSString *resumeId;
@property (nonatomic, copy, readonly) NSString *resumeFileName;
@property (nonatomic, assign, readonly) NSInteger fitScore;
@property (nonatomic, copy, readonly) NSString *summary;
@property (nonatomic, copy, readonly) NSArray<NSString *> *strengths;
@property (nonatomic, copy, readonly) NSArray<NSString *> *companyPriorities;
@property (nonatomic, copy, readonly) NSArray<NSString *> *gaps;
@property (nonatomic, copy, readonly) NSString *recommendation;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@end

@interface AccountitAPICPAJobFitAnalysisListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobFitAnalysisItem *> *items;
@end

NS_ASSUME_NONNULL_END
