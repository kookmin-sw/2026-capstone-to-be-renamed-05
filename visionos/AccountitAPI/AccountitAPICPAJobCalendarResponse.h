#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAJobListItem;

@interface AccountitAPICPAJobCalendarDay : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *date;
@property (nonatomic, assign, readonly) NSInteger total;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobListItem *> *jobs;
@end

@interface AccountitAPICPAJobCalendarEvent : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *date;
@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, retain, readonly) AccountitAPICPAJobListItem *job;
@end

@interface AccountitAPICPAJobCalendarRange : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *startDate;
@property (nonatomic, copy, readonly, nullable) NSString *endDate;
@property (nonatomic, retain, readonly) AccountitAPICPAJobListItem *job;
@end

@interface AccountitAPICPAJobCalendarResponse : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *from;
@property (nonatomic, copy, readonly) NSString *to;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobCalendarDay *> *days;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobCalendarEvent *> *events;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPAJobCalendarRange *> *ranges;
@end

NS_ASSUME_NONNULL_END
