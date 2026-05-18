#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAJobListItem;
@class AccountitAPICPACompanyProfileSubmissionItem;

@interface AccountitAPICPAEmployeeTrendPoint : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *month;
@property (nonatomic, assign, readonly) NSInteger joined;
@property (nonatomic, assign, readonly) NSInteger left;
@property (nonatomic, assign, readonly) NSInteger total;
@end

@interface AccountitAPICPACompanyDetailItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, copy, readonly, nullable) NSString *websiteUrl;
@property (nonatomic, copy, readonly, nullable) NSString *logoUrl;
@property (nonatomic, copy, readonly, nullable) NSString *backgroundUrl;
@property (nonatomic, copy, readonly, nullable) NSString *description;
@property (nonatomic, copy, readonly) NSArray<NSString *> *tags;
@property (nonatomic, copy, readonly, nullable) NSNumber *employeeCount;
@property (nonatomic, copy, readonly, nullable) NSNumber *averageSalary;
@property (nonatomic, copy, readonly, nullable) NSNumber *foundedYear;
@property (nonatomic, copy, readonly, nullable) NSNumber *recentAttritionRate;
@property (nonatomic, assign, readonly) NSInteger openJobCount;
@property (nonatomic, copy, readonly, nullable) NSString *businessNumber;
@property (nonatomic, copy, readonly) NSArray<NSString *> *externalLinks;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAEmployeeTrendPoint *> *employeeTrend;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobListItem *> *openJobs;
@end

@interface AccountitAPICPACompanyDashboardResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPACompanyDetailItem *company;
@property (nonatomic, retain, readonly, nullable) AccountitAPICPACompanyProfileSubmissionItem *pendingProfileSubmission;
@end

NS_ASSUME_NONNULL_END
