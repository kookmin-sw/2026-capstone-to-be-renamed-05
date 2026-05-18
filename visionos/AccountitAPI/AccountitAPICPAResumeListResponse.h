#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPAResumeItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSString *fileName;
@property (nonatomic, copy, readonly) NSString *fileUrl;
@property (nonatomic, copy, readonly) NSString *contentType;
@property (nonatomic, assign, readonly) NSInteger byteSize;
@property (nonatomic, assign, readonly, getter=isPrimary) BOOL primary;
@property (nonatomic, copy, readonly) NSString *createdAt;
@property (nonatomic, copy, readonly) NSString *updatedAt;
@end

@interface AccountitAPICPAResumeListResponse : AccountitAPICollectionResponse

@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAResumeItem *> *items;
@end

NS_ASSUME_NONNULL_END
