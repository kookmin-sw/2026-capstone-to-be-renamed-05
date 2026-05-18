#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAAiSuggestionItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *jobId;
@property (nonatomic, copy, readonly) NSString *jobTitle;
@property (nonatomic, copy, readonly) NSString *summary;
@property (nonatomic, copy, readonly) NSArray<NSString *> *tags;
@property (nonatomic, copy, readonly) NSArray<NSString *> *risks;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@end

@interface AccountitAPICPAAiSuggestionListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAAiSuggestionItem *> *items;
@end

NS_ASSUME_NONNULL_END
