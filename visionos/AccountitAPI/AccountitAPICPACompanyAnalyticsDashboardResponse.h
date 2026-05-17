#import <AccountitAPI/AccountitAPIDTO.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPICPACompanyAnalyticsPeriod : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *from;
@property (nonatomic, copy, readonly) NSString *to;
@property (nonatomic, assign, readonly) NSInteger days;
@end

@interface AccountitAPICPACompanyAnalyticsSummary : AccountitAPIDTO

@property (nonatomic, assign, readonly) NSInteger detailViews;
@property (nonatomic, assign, readonly) NSInteger originalClicks;
@property (nonatomic, assign, readonly) NSInteger bookmarkAdds;
@property (nonatomic, assign, readonly) NSInteger bookmarkRemoves;
@property (nonatomic, assign, readonly) NSInteger currentBookmarks;
@property (nonatomic, assign, readonly) double originalClickRate;
@property (nonatomic, assign, readonly) double bookmarkConversionRate;
@end

@interface AccountitAPICPACompanyAnalyticsDailyPoint : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *date;
@property (nonatomic, assign, readonly) NSInteger detailViews;
@property (nonatomic, assign, readonly) NSInteger originalClicks;
@property (nonatomic, assign, readonly) NSInteger bookmarkAdds;
@end

@interface AccountitAPICPACompanyAnalyticsJobItem : AccountitAPIDTO

@property (nonatomic, copy, readonly) NSString *jobId;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *status;
@property (nonatomic, assign, readonly) NSInteger detailViews;
@property (nonatomic, assign, readonly) NSInteger originalClicks;
@property (nonatomic, assign, readonly) NSInteger bookmarkAdds;
@property (nonatomic, assign, readonly) NSInteger bookmarkRemoves;
@property (nonatomic, assign, readonly) NSInteger currentBookmarks;
@property (nonatomic, assign, readonly) double originalClickRate;
@property (nonatomic, assign, readonly) double bookmarkConversionRate;
@end

@interface AccountitAPICPACompanyAnalyticsDashboardResponse : AccountitAPIDTO

@property (nonatomic, retain, readonly) AccountitAPICPACompanyAnalyticsPeriod *period;
@property (nonatomic, retain, readonly) AccountitAPICPACompanyAnalyticsSummary *summary;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPACompanyAnalyticsDailyPoint *> *daily;
@property (nonatomic, copy, readonly) NSArray<AccountitAPICPACompanyAnalyticsJobItem *> *jobs;
@property (nonatomic, copy, readonly) NSString *generatedAt;
@end

NS_ASSUME_NONNULL_END
