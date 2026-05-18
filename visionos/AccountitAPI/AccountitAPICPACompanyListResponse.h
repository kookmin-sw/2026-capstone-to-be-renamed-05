#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPACompanyListItem : AccountitAPIDTO

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
@end

@interface AccountitAPICPACompanyListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPACompanyListItem *> *items;
@end

NS_ASSUME_NONNULL_END
