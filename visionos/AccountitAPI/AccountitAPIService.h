#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class AccountitAPICPAHealthResponse;
@class AccountitAPICPAAuthUserResponse;
@class AccountitAPICPAOkResponse;
@class AccountitAPICPAJobListResponse;
@class AccountitAPICPAJobCalendarResponse;
@class AccountitAPICPAJobDetailResponse;
@class AccountitAPICPACompanyListResponse;
@class AccountitAPICPACompanyDetailItem;
@class AccountitAPICPACompanyDashboardResponse;
@class AccountitAPICPACompanyAnalyticsDashboardResponse;
@class AccountitAPICPACompanyProfileSubmissionItem;
@class AccountitAPICPACompanyJobAutofillResponse;
@class AccountitAPICPAJobSubmissionItem;
@class AccountitAPICPAJobSubmissionListResponse;
@class AccountitAPICPACompanyManagedJobListResponse;
@class AccountitAPICPACompanyManagedJobItem;
@class AccountitAPICPAUploadURLResponse;
@class AccountitAPICPAAssetCompletionResponse;
@class AccountitAPICPAAssetItem;
@class AccountitAPICPAJobFilterPreferenceResponse;
@class AccountitAPICPAUserJobPresetListResponse;
@class AccountitAPICPAUserJobPresetItem;
@class AccountitAPICPAMyProfileResponse;
@class AccountitAPICPAMyCommunityActivityListResponse;
@class AccountitAPICPAPersonalVerificationRequestItem;
@class AccountitAPICPABookmarkListResponse;
@class AccountitAPICPABookmarkItem;
@class AccountitAPICPAJobFitAnalysisListResponse;
@class AccountitAPICPACreateJobFitAnalysisResponse;
@class AccountitAPICPAResumeListResponse;
@class AccountitAPICPAResumeItem;
@class AccountitAPIFileDownloadResponse;
@class AccountitAPICPANotificationListResponse;
@class AccountitAPICPANotificationUnreadCountResponse;
@class AccountitAPICPANotificationReadAllResponse;
@class AccountitAPICPANotificationItem;
@class AccountitAPICPATagSubscriptionListResponse;
@class AccountitAPICPATagSubscriptionItem;
@class AccountitAPICPACommunityPostListResponse;
@class AccountitAPICPACommunityPostDetailResponse;
@class AccountitAPICPACommunityPostItem;
@class AccountitAPICPACommunityAnswerItem;
@class AccountitAPICPAAdminDashboardResponse;
@class AccountitAPICPASourceListResponse;
@class AccountitAPICPAAdminJobListResponse;
@class AccountitAPICPAAdminJobItem;
@class AccountitAPICPAAiSuggestionListResponse;
@class AccountitAPICPAAiSuggestionItem;
@class AccountitAPICPAAdminCompanyListResponse;
@class AccountitAPICPAAdminCompanyItem;
@class AccountitAPICPAAdminMemberListResponse;
@class AccountitAPICPAPersonalVerificationRequestListResponse;
@class AccountitAPICPACompanyProfileSubmissionListResponse;
@class AccountitAPICPAOpsDeployResponse;

typedef void (^AccountitAPICPAHealthResponseCompletionHandler)(
    AccountitAPICPAHealthResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAuthUserResponseCompletionHandler)(
    AccountitAPICPAAuthUserResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAOkResponseCompletionHandler)(
    AccountitAPICPAOkResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobListResponseCompletionHandler)(
    AccountitAPICPAJobListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobCalendarResponseCompletionHandler)(
    AccountitAPICPAJobCalendarResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobDetailResponseCompletionHandler)(
    AccountitAPICPAJobDetailResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyListResponseCompletionHandler)(
    AccountitAPICPACompanyListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyDetailItemCompletionHandler)(
    AccountitAPICPACompanyDetailItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyDashboardResponseCompletionHandler)(
    AccountitAPICPACompanyDashboardResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyAnalyticsDashboardResponseCompletionHandler)(
    AccountitAPICPACompanyAnalyticsDashboardResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyProfileSubmissionItemCompletionHandler)(
    AccountitAPICPACompanyProfileSubmissionItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyJobAutofillResponseCompletionHandler)(
    AccountitAPICPACompanyJobAutofillResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobSubmissionItemCompletionHandler)(
    AccountitAPICPAJobSubmissionItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobSubmissionListResponseCompletionHandler)(
    AccountitAPICPAJobSubmissionListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyManagedJobListResponseCompletionHandler)(
    AccountitAPICPACompanyManagedJobListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyManagedJobItemCompletionHandler)(
    AccountitAPICPACompanyManagedJobItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAUploadURLResponseCompletionHandler)(
    AccountitAPICPAUploadURLResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAssetCompletionResponseCompletionHandler)(
    AccountitAPICPAAssetCompletionResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAssetItemCompletionHandler)(
    AccountitAPICPAAssetItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobFilterPreferenceResponseCompletionHandler)(
    AccountitAPICPAJobFilterPreferenceResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAUserJobPresetListResponseCompletionHandler)(
    AccountitAPICPAUserJobPresetListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAUserJobPresetItemCompletionHandler)(
    AccountitAPICPAUserJobPresetItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAMyProfileResponseCompletionHandler)(
    AccountitAPICPAMyProfileResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAMyCommunityActivityListResponseCompletionHandler)(
    AccountitAPICPAMyCommunityActivityListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAPersonalVerificationRequestItemCompletionHandler)(
    AccountitAPICPAPersonalVerificationRequestItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPABookmarkListResponseCompletionHandler)(
    AccountitAPICPABookmarkListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPABookmarkItemCompletionHandler)(
    AccountitAPICPABookmarkItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAJobFitAnalysisListResponseCompletionHandler)(
    AccountitAPICPAJobFitAnalysisListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACreateJobFitAnalysisResponseCompletionHandler)(
    AccountitAPICPACreateJobFitAnalysisResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAResumeListResponseCompletionHandler)(
    AccountitAPICPAResumeListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAResumeItemCompletionHandler)(
    AccountitAPICPAResumeItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPIFileDownloadResponseCompletionHandler)(
    AccountitAPIFileDownloadResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPANotificationListResponseCompletionHandler)(
    AccountitAPICPANotificationListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPANotificationUnreadCountResponseCompletionHandler)(
    AccountitAPICPANotificationUnreadCountResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPANotificationReadAllResponseCompletionHandler)(
    AccountitAPICPANotificationReadAllResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPANotificationItemCompletionHandler)(
    AccountitAPICPANotificationItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPATagSubscriptionListResponseCompletionHandler)(
    AccountitAPICPATagSubscriptionListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPATagSubscriptionItemCompletionHandler)(
    AccountitAPICPATagSubscriptionItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACommunityPostListResponseCompletionHandler)(
    AccountitAPICPACommunityPostListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACommunityPostDetailResponseCompletionHandler)(
    AccountitAPICPACommunityPostDetailResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACommunityPostItemCompletionHandler)(
    AccountitAPICPACommunityPostItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACommunityAnswerItemCompletionHandler)(
    AccountitAPICPACommunityAnswerItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAdminDashboardResponseCompletionHandler)(
    AccountitAPICPAAdminDashboardResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPASourceListResponseCompletionHandler)(
    AccountitAPICPASourceListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAdminJobListResponseCompletionHandler)(
    AccountitAPICPAAdminJobListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAdminJobItemCompletionHandler)(
    AccountitAPICPAAdminJobItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAiSuggestionListResponseCompletionHandler)(
    AccountitAPICPAAiSuggestionListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAiSuggestionItemCompletionHandler)(
    AccountitAPICPAAiSuggestionItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAdminCompanyListResponseCompletionHandler)(
    AccountitAPICPAAdminCompanyListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAdminCompanyItemCompletionHandler)(
    AccountitAPICPAAdminCompanyItem * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAAdminMemberListResponseCompletionHandler)(
    AccountitAPICPAAdminMemberListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAPersonalVerificationRequestListResponseCompletionHandler)(
    AccountitAPICPAPersonalVerificationRequestListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPACompanyProfileSubmissionListResponseCompletionHandler)(
    AccountitAPICPACompanyProfileSubmissionListResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

typedef void (^AccountitAPICPAOpsDeployResponseCompletionHandler)(
    AccountitAPICPAOpsDeployResponse * _Nullable response,
    NSError * __autoreleasing * _Nullable error
);

@interface AccountitAPIService : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

+ (NSProgress *)cpaHealthWithCompletionHandler:(AccountitAPICPAHealthResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaHealthzWithCompletionHandler:(AccountitAPICPAHealthResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaRegisterWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAuthUserResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaLoginWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAuthUserResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaMeWithCompletionHandler:(AccountitAPICPAAuthUserResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaLogoutWithCompletionHandler:(AccountitAPICPAOkResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaJobsWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAJobListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaJobCalendarWithQuery:(NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAJobCalendarResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaJobDetailWithID:(NSString *)jobID
                completionHandler:(AccountitAPICPAJobDetailResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaRecordJobEngagementWithJobID:(NSString *)jobID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAOkResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCompaniesWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPACompanyListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCompanyDetailWithID:(NSString *)companyID
                completionHandler:(AccountitAPICPACompanyDetailItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaMyCompanyWithCompletionHandler:(AccountitAPICPACompanyDashboardResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaMyCompanyAnalyticsWithCompletionHandler:(AccountitAPICPACompanyAnalyticsDashboardResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCompanyProfileSubmissionWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACompanyProfileSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaUpdateCompanyLogoWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACompanyDetailItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaUpdateCompanyBackgroundWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACompanyDetailItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCompanyJobAutofillDraftWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACompanyJobAutofillResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCompanyJobSubmissionWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaMyCompanyJobSubmissionsWithCompletionHandler:(AccountitAPICPAJobSubmissionListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaUpdateMyCompanyJobSubmissionWithID:(NSString *)submissionID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaCancelMyCompanyJobSubmissionWithID:(NSString *)submissionID
                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaMyCompanyJobsWithCompletionHandler:(AccountitAPICPACompanyManagedJobListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCompanyJobEditSubmissionWithJobID:(NSString *)jobID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaCloseMyCompanyJobWithID:(NSString *)jobID
                completionHandler:(AccountitAPICPACompanyManagedJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCompanyLogoUploadURLWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAUploadURLResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCompanyBackgroundUploadURLWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAUploadURLResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateProfileImageUploadURLWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAUploadURLResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCompleteAssetUploadWithID:(NSString *)assetID
                completionHandler:(AccountitAPICPAAssetCompletionResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaUploadLocalAssetWithID:(NSString *)assetID
                data:(NSData *)data
                contentType:(NSString *)contentType
                completionHandler:(AccountitAPICPAAssetItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaJobFilterPreferenceWithCompletionHandler:(AccountitAPICPAJobFilterPreferenceResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaUpdateJobFilterPreferenceWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAJobFilterPreferenceResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaJobPresetsWithCompletionHandler:(AccountitAPICPAUserJobPresetListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateJobPresetWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAUserJobPresetItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaUseJobPresetWithID:(NSString *)presetID
                completionHandler:(AccountitAPICPAUserJobPresetItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaDeleteJobPresetWithID:(NSString *)presetID
                completionHandler:(AccountitAPICPAUserJobPresetItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaMyProfileWithCompletionHandler:(AccountitAPICPAMyProfileResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaUpdateMyProfileWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAMyProfileResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaDeleteMyProfileImageWithCompletionHandler:(AccountitAPICPAMyProfileResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaUpdatePasswordWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAOkResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaMyCommunityActivityWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAMyCommunityActivityListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreatePersonalVerificationRequestWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAPersonalVerificationRequestItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaBookmarksWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPABookmarkListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateBookmarkWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPABookmarkItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaDeleteBookmarkWithID:(NSString *)bookmarkID
                completionHandler:(AccountitAPICPAOkResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaJobFitAnalysesWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAJobFitAnalysisListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaHighFitJobAnalysesWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAJobFitAnalysisListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateJobFitAnalysisWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACreateJobFitAnalysisResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaResumesWithCompletionHandler:(AccountitAPICPAResumeListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateResumeWithData:(NSData *)data
                fileName:(NSString *)fileName
                contentType:(NSString *)contentType
                completionHandler:(AccountitAPICPAResumeItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaDownloadResumeWithID:(NSString *)resumeID
                completionHandler:(AccountitAPIFileDownloadResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaDeleteResumeWithID:(NSString *)resumeID
                completionHandler:(AccountitAPICPAOkResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaSetPrimaryResumeWithID:(NSString *)resumeID
                completionHandler:(AccountitAPICPAResumeItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaNotificationsWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPANotificationListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaNotificationUnreadCountWithCompletionHandler:(AccountitAPICPANotificationUnreadCountResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaMarkAllNotificationsReadWithCompletionHandler:(AccountitAPICPANotificationReadAllResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaMarkNotificationReadWithID:(NSString *)notificationID
                completionHandler:(AccountitAPICPANotificationItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaTagSubscriptionsWithCompletionHandler:(AccountitAPICPATagSubscriptionListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaSubscribeTagWithLabelID:(NSString *)labelID
                completionHandler:(AccountitAPICPATagSubscriptionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaUnsubscribeTagWithLabelID:(NSString *)labelID
                completionHandler:(AccountitAPICPAOkResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCommunityPostsWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPACommunityPostListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCommunityPostDetailWithID:(NSString *)postID
                completionHandler:(AccountitAPICPACommunityPostDetailResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCommunityPostWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACommunityPostItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaCreateCommunityAnswerWithPostID:(NSString *)postID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACommunityAnswerItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaLikeCommunityPostWithID:(NSString *)postID
                completionHandler:(AccountitAPICPACommunityPostItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaLikeCommunityAnswerWithID:(NSString *)answerID
                completionHandler:(AccountitAPICPACommunityAnswerItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaResolveCommunityPostWithID:(NSString *)postID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACommunityPostDetailResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminHealthWithCompletionHandler:(AccountitAPICPAHealthResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminDashboardWithCompletionHandler:(AccountitAPICPAAdminDashboardResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminSourcesWithCompletionHandler:(AccountitAPICPASourceListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminJobsWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAAdminJobListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminJobWithID:(NSString *)jobID
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminCreateJobWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminUpdateJobWithID:(NSString *)jobID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminCloseJobWithID:(NSString *)jobID
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminUpdateJobStatusWithID:(NSString *)jobID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminRefreshJobWithID:(NSString *)jobID
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminAiSuggestionsWithCompletionHandler:(AccountitAPICPAAiSuggestionListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminApproveAiSuggestionWithID:(NSString *)suggestionID
                completionHandler:(AccountitAPICPAAiSuggestionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminRejectAiSuggestionWithID:(NSString *)suggestionID
                completionHandler:(AccountitAPICPAAiSuggestionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminCompaniesWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAAdminCompanyListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminCompanyWithID:(NSString *)companyID
                completionHandler:(AccountitAPICPAAdminCompanyItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminCreateCompanyWithBody:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAdminCompanyItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminUpdateCompanyWithID:(NSString *)companyID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAAdminCompanyItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminMembersWithQuery:(nullable NSDictionary<NSString *, id> *)query
                completionHandler:(AccountitAPICPAAdminMemberListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminPersonalVerificationRequestsWithCompletionHandler:(AccountitAPICPAPersonalVerificationRequestListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminApprovePersonalVerificationRequestWithID:(NSString *)requestID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAPersonalVerificationRequestItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminRejectPersonalVerificationRequestWithID:(NSString *)requestID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAPersonalVerificationRequestItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminJobSubmissionsWithCompletionHandler:(AccountitAPICPAJobSubmissionListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminApproveJobSubmissionWithID:(NSString *)submissionID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminRejectJobSubmissionWithID:(NSString *)submissionID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminProfileSubmissionsWithCompletionHandler:(AccountitAPICPACompanyProfileSubmissionListResponseCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminApproveProfileSubmissionWithID:(NSString *)submissionID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACompanyProfileSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaAdminRejectProfileSubmissionWithID:(NSString *)submissionID
                body:(NSDictionary<NSString *, id> *)body
                completionHandler:(AccountitAPICPACompanyProfileSubmissionItemCompletionHandler)completionHandler;
+ (NSProgress *)cpaOpsDeployWithBody:(NSDictionary<NSString *, id> *)body
                bearerToken:(NSString *)bearerToken
                completionHandler:(AccountitAPICPAOpsDeployResponseCompletionHandler)completionHandler;

@end

NS_ASSUME_NONNULL_END
