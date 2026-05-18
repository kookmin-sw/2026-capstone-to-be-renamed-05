#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAJobSubmissionItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *companyId;
@property (nonatomic, copy, readonly) NSString *companyName;
@property (nonatomic, copy, readonly) NSString *submissionType;
@property (nonatomic, copy, readonly, nullable) NSString *targetJobId;
@property (nonatomic, copy, readonly, nullable) NSString *targetJobTitle;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *description;
@property (nonatomic, copy, readonly, nullable) NSString *originalUrl;
@property (nonatomic, copy, readonly) NSString *jobFamily;
@property (nonatomic, copy, readonly) NSString *employmentType;
@property (nonatomic, copy, readonly) NSString *kicpaCondition;
@property (nonatomic, copy, readonly) NSString *traineeStatus;
@property (nonatomic, copy, readonly, nullable) NSNumber *practicalTrainingInstitution;
@property (nonatomic, copy, readonly, nullable) NSNumber *minExperienceYears;
@property (nonatomic, copy, readonly, nullable) NSNumber *maxExperienceYears;
@property (nonatomic, copy, readonly, nullable) NSString *location;
@property (nonatomic, copy, readonly) NSString *deadlineType;
@property (nonatomic, copy, readonly, nullable) NSString *deadline;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, copy, readonly, nullable) NSString *adminNote;
@property (nonatomic, copy, readonly, nullable) NSString *approvedJobId;
@property (nonatomic, copy, readonly) NSString *submittedByUsername;
@property (nonatomic, copy, readonly, nullable) NSString *reviewedByUsername;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@property (nonatomic, copy, readonly, nullable) NSString *reviewedAt;
@end

@interface AccountitAPICPAJobSubmissionListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobSubmissionItem *> *items;
@end

NS_ASSUME_NONNULL_END
