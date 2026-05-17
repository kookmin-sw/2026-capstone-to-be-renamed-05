#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAJobAiSuggestion;

@interface AccountitAPICPAJobDetailResponse : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *companyId;
@property (nonatomic, copy, readonly) NSString *companyName;
@property (nonatomic, copy, readonly, nullable) NSNumber *companyAverageSalary;
@property (nonatomic, copy, readonly, nullable) NSString *companyLogoUrl;
@property (nonatomic, copy, readonly, nullable) NSString *companyBackgroundUrl;
@property (nonatomic, copy, readonly) NSString *companyType;
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
@property (nonatomic, copy, readonly, nullable) NSNumber *dDay;
@property (nonatomic, copy, readonly) NSString *sourceName;
@property (nonatomic, copy, readonly) NSString *originalUrl;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *lastCheckedAt;
@property (nonatomic, copy, readonly) NSArray<NSString *> *labels;
@property (nonatomic, copy, readonly) NSString *description;
@property (nonatomic, copy, readonly, nullable) NSString *aiSummary;
@property (nonatomic, retain, readonly, nullable) AccountitAPICPAJobAiSuggestion *aiSuggestion;
@end

NS_ASSUME_NONNULL_END
