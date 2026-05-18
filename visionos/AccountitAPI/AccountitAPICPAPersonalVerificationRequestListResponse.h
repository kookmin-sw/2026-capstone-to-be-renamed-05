#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAPersonalVerificationRequestItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *userId;
@property (nonatomic, copy, readonly) NSString *username;
@property (nonatomic, copy, readonly, nullable) NSString *displayName;
@property (nonatomic, copy, readonly) NSString *applicantName;
@property (nonatomic, copy, readonly, nullable) NSString *birthDate;
@property (nonatomic, copy, readonly, nullable) NSString *registrationNumber;
@property (nonatomic, copy, readonly, nullable) NSString *registrationNumberLast4;
@property (nonatomic, copy, readonly) NSString *requestedCareerStage;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, copy, readonly, nullable) NSString *adminNote;
@property (nonatomic, copy, readonly, nullable) NSString *reviewedByUsername;
@property (nonatomic, copy, readonly, nullable) NSString *reviewedAt;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@end

@interface AccountitAPICPAPersonalVerificationRequestListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAPersonalVerificationRequestItem *> *items;
@end

NS_ASSUME_NONNULL_END
