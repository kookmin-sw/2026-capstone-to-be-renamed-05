#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAPersonalVerificationRequestItem;

@interface AccountitAPICPAMyProfileResponse : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *username;
@property (nonatomic, copy, readonly, nullable) NSString *displayName;
@property (nonatomic, copy, readonly, nullable) NSString *profileImageUrl;
@property (nonatomic, copy, readonly) NSString *role;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *cpaVerificationStatus;
@property (nonatomic, copy, readonly, nullable) NSString *careerStage;
@property (nonatomic, copy, readonly) NSString *employmentHistoryStatus;
@property (nonatomic, copy, readonly, nullable) NSString *verifiedAt;
@property (nonatomic, assign, readonly) BOOL traineeRoomAccess;
@property (nonatomic, retain, readonly, nullable) AccountitAPICPAPersonalVerificationRequestItem *pendingVerificationRequest;
@end

NS_ASSUME_NONNULL_END
