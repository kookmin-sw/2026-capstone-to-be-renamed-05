#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPACompanyJobAutofillDraft : AccountitAPIDTO

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
@end

@interface AccountitAPICPACompanyJobAutofillResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPACompanyJobAutofillDraft *draft;
@property (nonatomic, copy, readonly) NSArray<NSString *> *warnings;
@end

NS_ASSUME_NONNULL_END
