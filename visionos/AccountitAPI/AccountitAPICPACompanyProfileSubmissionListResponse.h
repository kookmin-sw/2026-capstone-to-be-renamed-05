#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPACompanyProfileProposal : AccountitAPIDTO

@property (nonatomic, copy, readonly, nullable) NSString *name;
@property (nonatomic, copy, readonly, nullable) NSString *type;
@property (nonatomic, copy, readonly, nullable) NSString *websiteUrl;
@property (nonatomic, copy, readonly, nullable) NSString *description;
@property (nonatomic, copy, readonly, nullable) NSString *businessNumber;
@property (nonatomic, copy, readonly, nullable) NSArray<NSString *> *externalLinks;
@property (nonatomic, copy, readonly, nullable) NSArray<NSString *> *tags;
@end

@interface AccountitAPICPACompanyProfileSubmissionItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *companyId;
@property (nonatomic, copy, readonly) NSString *companyName;
@property (nonatomic, retain, readonly) AccountitAPICPACompanyProfileProposal *proposed;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, copy, readonly, nullable) NSString *adminNote;
@property (nonatomic, copy, readonly) NSString *submittedByUsername;
@property (nonatomic, copy, readonly, nullable) NSString *reviewedByUsername;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@property (nonatomic, copy, readonly, nullable) NSString *reviewedAt;
@end

@interface AccountitAPICPACompanyProfileSubmissionListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPACompanyProfileSubmissionItem *> *items;
@end

NS_ASSUME_NONNULL_END
