#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPASafeUser : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *username;
@property (nonatomic, copy, readonly, nullable) NSString *displayName;
@property (nonatomic, copy, readonly, nullable) NSString *profileImageUrl;
@property (nonatomic, copy, readonly) NSString *role;
@property (nonatomic, copy, readonly, nullable) NSString *companyId;
@end

@interface AccountitAPICPAAuthUserResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPASafeUser *user;
@property (nonatomic, copy, readonly) NSString *accessToken;
@end

NS_ASSUME_NONNULL_END
