#import <XCTest/XCTest.h>
#import <AccountitAPI/AccountitAPI.h>

typedef NSProgress *(^AccountitAPIServiceLiveInvocation)(id completionHandler);

@interface _AccountitAPIServiceLiveSpec : NSObject
@property (nonatomic, copy) NSString *name;
@property (nonatomic, assign) Class responseClass;
@property (nonatomic, assign) BOOL requiresSuccess;
@property (nonatomic, assign) BOOL allowsNotFound;
@property (nonatomic, assign) BOOL allowsServerError;
@property (nonatomic, copy) AccountitAPIServiceLiveInvocation invocation;
@end

@implementation _AccountitAPIServiceLiveSpec

@synthesize name = _name;
@synthesize responseClass = _responseClass;
@synthesize requiresSuccess = _requiresSuccess;
@synthesize allowsNotFound = _allowsNotFound;
@synthesize allowsServerError = _allowsServerError;
@synthesize invocation = _invocation;

- (void)dealloc {
    [_name release];
    [_invocation release];
    [super dealloc];
}

@end

static _AccountitAPIServiceLiveSpec *_AccountitAPIServiceLiveSpecMake(NSString *name,
                                                                    Class responseClass,
                                                                    BOOL requiresSuccess,
                                                                    BOOL allowsNotFound,
                                                                    BOOL allowsServerError,
                                                                    AccountitAPIServiceLiveInvocation invocation) {
    _AccountitAPIServiceLiveSpec *spec = [[_AccountitAPIServiceLiveSpec alloc] init];

    [spec setName:name];
    [spec setResponseClass:responseClass];
    [spec setRequiresSuccess:requiresSuccess];
    [spec setAllowsNotFound:allowsNotFound];
    [spec setAllowsServerError:allowsServerError];
    [spec setInvocation:invocation];

    return [spec autorelease];
}

@interface AccountitAPIServiceTests : XCTestCase
@end

@implementation AccountitAPIServiceTests

- (void)setUp {
    [super setUp];

    [self clearCookies];
}

- (void)tearDown {
    [self clearCookies];

    [super tearDown];
}

- (void)clearCookies {
    NSArray *cookies = [[[NSHTTPCookieStorage sharedHTTPCookieStorage] cookies] copy];

    for (NSHTTPCookie *cookie in cookies) {
        [[NSHTTPCookieStorage sharedHTTPCookieStorage] deleteCookie:cookie];
    }

    [cookies release];
}

- (NSString *)uniqueUsername {
    NSUUID *UUID = [[NSUUID alloc] init];
    NSString *UUIDString = [[UUID UUIDString] retain];
    NSString *compactUUID = [[UUIDString stringByReplacingOccurrencesOfString:@"-" withString:@""] retain];
    NSString *suffix = [[compactUUID substringToIndex:12] retain];
    NSString *username = [[NSString alloc] initWithFormat:@"acct%@", [suffix lowercaseString]];

    [suffix release];
    [compactUUID release];
    [UUIDString release];
    [UUID release];

    return [username autorelease];
}

- (NSString *)missingID {
    return @"00000000-0000-4000-8000-000000000000";
}

- (NSDictionary<NSString *, id> *)registerBody {
    return @{
        @"username": [self uniqueUsername],
        @"password": @"password123",
        @"role": @"JOB_SEEKER",
        @"displayName": @"Accountit API Live Test"
    };
}

- (NSDictionary<NSString *, id> *)invalidLoginBody {
    return @{
        @"username": [self uniqueUsername],
        @"password": @"password123"
    };
}

- (NSDictionary<NSString *, id> *)jobsQuery {
    return @{
        @"page": @1,
        @"pageSize": @1
    };
}

- (NSDictionary<NSString *, id> *)jobCalendarQuery {
    return @{
        @"from": @"2026-05-01",
        @"to": @"2026-05-31",
        @"page": @1,
        @"pageSize": @1
    };
}

- (NSDictionary<NSString *, id> *)companiesQuery {
    return @{
        @"search": @"회계"
    };
}

- (NSDictionary<NSString *, id> *)communityPostsQuery {
    return @{
        @"sort": @"latest"
    };
}

- (NSDictionary<NSString *, id> *)communityActivityQuery {
    return @{
        @"type": @"posts"
    };
}

- (NSDictionary<NSString *, id> *)notificationsQuery {
    return @{
        @"page": @1,
        @"pageSize": @1
    };
}

- (NSDictionary<NSString *, id> *)jobEngagementBody {
    return @{
        @"type": @"DETAIL_VIEW"
    };
}

- (NSDictionary<NSString *, id> *)companyProfileSubmissionBody {
    return @{
        @"name": @"Accountit Live Company",
        @"type": @"LOCAL_ACCOUNTING_FIRM",
        @"websiteUrl": @"https://example.com",
        @"description": @"Live API test company profile submission."
    };
}

- (NSDictionary<NSString *, id> *)updateCompanyLogoBody {
    return @{
        @"logoAssetId": [self missingID]
    };
}

- (NSDictionary<NSString *, id> *)updateCompanyBackgroundBody {
    return @{
        @"backgroundAssetId": [self missingID]
    };
}

- (NSDictionary<NSString *, id> *)companyJobAutofillBody {
    return @{
        @"sourceText": @"감사본부 수습 CPA 채용 공고입니다. 회계감사 보조와 재무제표 검토 업무를 수행합니다. 접수마감은 2026-05-31입니다.",
        @"originalUrl": @"https://example.com/careers/live"
    };
}

- (NSDictionary<NSString *, id> *)companyJobSubmissionBody {
    return @{
        @"title": @"수습 CPA 감사본부 채용",
        @"description": @"회계감사 보조와 재무제표 검토 업무를 수행합니다.",
        @"originalUrl": @"https://example.com/careers/audit-trainee",
        @"jobFamily": @"AUDIT",
        @"employmentType": @"FULL_TIME",
        @"kicpaCondition": @"PREFERRED",
        @"traineeStatus": @"AVAILABLE",
        @"practicalTrainingInstitution": @YES,
        @"minExperienceYears": @0,
        @"maxExperienceYears": @1,
        @"location": @"서울 중구",
        @"deadlineType": @"FIXED_DATE",
        @"deadline": @"2026-05-31T14:59:59.000Z"
    };
}

- (NSDictionary<NSString *, id> *)uploadURLBody {
    return @{
        @"fileName": @"asset.png",
        @"contentType": @"image/png",
        @"byteSize": @12
    };
}

- (NSData *)rawUploadData {
    return [@"raw-live-upload" dataUsingEncoding:NSUTF8StringEncoding];
}

- (NSDictionary<NSString *, id> *)jobFilterBody {
    return @{
        @"filter": @{
            @"search": @"감사"
        }
    };
}

- (NSDictionary<NSString *, id> *)jobPresetBody {
    return @{
        @"name": @"서울 감사",
        @"filter": @{
            @"search": @"감사"
        }
    };
}

- (NSDictionary<NSString *, id> *)profileBody {
    return @{
        @"displayName": @"Accountit Live Tester"
    };
}

- (NSDictionary<NSString *, id> *)passwordBody {
    return @{
        @"currentPassword": @"password123",
        @"newPassword": @"password456"
    };
}

- (NSDictionary<NSString *, id> *)personalVerificationBody {
    return @{
        @"applicantName": @"Live Tester",
        @"birthDate": @"1998-03-14",
        @"registrationNumber": @"12345",
        @"requestedCareerStage": @"CPA_UNPLACED"
    };
}

- (NSDictionary<NSString *, id> *)bookmarkBody {
    return @{
        @"targetType": @"JOB",
        @"targetId": [self missingID]
    };
}

- (NSDictionary<NSString *, id> *)jobFitBody {
    return @{
        @"jobId": [self missingID],
        @"resumeId": [self missingID]
    };
}

- (NSDictionary<NSString *, id> *)communityPostBody {
    return @{
        @"boardType": @"FREE",
        @"title": @"Live API Test Post",
        @"content": @"This post body is generated by the AccountitAPI live XCTest.",
        @"tags": @[
            @"live"
        ],
        @"isAnonymous": @YES
    };
}

- (NSDictionary<NSString *, id> *)communityAnswerBody {
    return @{
        @"content": @"This answer body is generated by the AccountitAPI live XCTest.",
        @"isAnonymous": @YES
    };
}

- (NSDictionary<NSString *, id> *)resolveCommunityPostBody {
    return @{
        @"answerId": [self missingID]
    };
}

- (NSDictionary<NSString *, id> *)adminJobBody {
    return @{
        @"title": @"관리자 라이브 공고",
        @"description": @"관리자 API live 테스트용 공고입니다.",
        @"companyId": [self missingID],
        @"sourceId": [self missingID],
        @"originalUrl": @"https://example.com/admin-job",
        @"jobFamily": @"AUDIT",
        @"employmentType": @"FULL_TIME",
        @"companyType": @"LOCAL_ACCOUNTING_FIRM",
        @"kicpaCondition": @"PREFERRED",
        @"traineeStatus": @"AVAILABLE",
        @"deadlineType": @"UNTIL_FILLED",
        @"status": @"OPEN"
    };
}

- (NSDictionary<NSString *, id> *)adminJobStatusBody {
    return @{
        @"status": @"CLOSED"
    };
}

- (NSDictionary<NSString *, id> *)adminCompanyBody {
    return @{
        @"name": @"Accountit Admin Live Company",
        @"type": @"LOCAL_ACCOUNTING_FIRM",
        @"websiteUrl": @"https://example.com/admin-company"
    };
}

- (NSDictionary<NSString *, id> *)adminMembersQuery {
    return @{
        @"role": @"JOB_SEEKER"
    };
}

- (NSDictionary<NSString *, id> *)reviewSubmissionBody {
    return @{
        @"adminNote": @"Reviewed by AccountitAPI live XCTest."
    };
}

- (NSDictionary<NSString *, id> *)opsDeployBody {
    return @{
        @"ref": @"refs/heads/develop",
        @"sha": @"0123456789012345678901234567890123456789",
        @"actor": @"accountit-live-test",
        @"runId": @"1"
    };
}

- (NSArray<_AccountitAPIServiceLiveSpec *> *)allLiveEndpointSpecs {
    NSMutableArray *specs = [[NSMutableArray alloc] init];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaHealthWithCompletionHandler:",
        [AccountitAPICPAHealthResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaHealthWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaHealthzWithCompletionHandler:",
        [AccountitAPICPAHealthResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaHealthzWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaRegisterWithBody:completionHandler:",
        [AccountitAPICPAAuthUserResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaRegisterWithBody:[self registerBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaLoginWithBody:completionHandler:",
        [AccountitAPICPAAuthUserResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaLoginWithBody:[self invalidLoginBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMeWithCompletionHandler:",
        [AccountitAPICPAAuthUserResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMeWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaLogoutWithCompletionHandler:",
        [AccountitAPICPAOkResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaLogoutWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaJobsWithQuery:completionHandler:",
        [AccountitAPICPAJobListResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaJobsWithQuery:[self jobsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaJobCalendarWithQuery:completionHandler:",
        [AccountitAPICPAJobCalendarResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaJobCalendarWithQuery:[self jobCalendarQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaJobDetailWithID:completionHandler:",
        [AccountitAPICPAJobDetailResponse class],
        NO,
        YES,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaJobDetailWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaRecordJobEngagementWithJobID:body:completionHandler:",
        [AccountitAPICPAOkResponse class],
        NO,
        YES,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaRecordJobEngagementWithJobID:[self missingID] body:[self jobEngagementBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCompaniesWithQuery:completionHandler:",
        [AccountitAPICPACompanyListResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCompaniesWithQuery:[self companiesQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCompanyDetailWithID:completionHandler:",
        [AccountitAPICPACompanyDetailItem class],
        NO,
        YES,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCompanyDetailWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMyCompanyWithCompletionHandler:",
        [AccountitAPICPACompanyDashboardResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMyCompanyWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMyCompanyAnalyticsWithCompletionHandler:",
        [AccountitAPICPACompanyAnalyticsDashboardResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMyCompanyAnalyticsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCompanyProfileSubmissionWithBody:completionHandler:",
        [AccountitAPICPACompanyProfileSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCompanyProfileSubmissionWithBody:[self companyProfileSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUpdateCompanyLogoWithBody:completionHandler:",
        [AccountitAPICPACompanyDetailItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUpdateCompanyLogoWithBody:[self updateCompanyLogoBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUpdateCompanyBackgroundWithBody:completionHandler:",
        [AccountitAPICPACompanyDetailItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUpdateCompanyBackgroundWithBody:[self updateCompanyBackgroundBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCompanyJobAutofillDraftWithBody:completionHandler:",
        [AccountitAPICPACompanyJobAutofillResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCompanyJobAutofillDraftWithBody:[self companyJobAutofillBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCompanyJobSubmissionWithBody:completionHandler:",
        [AccountitAPICPAJobSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCompanyJobSubmissionWithBody:[self companyJobSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMyCompanyJobSubmissionsWithCompletionHandler:",
        [AccountitAPICPAJobSubmissionListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMyCompanyJobSubmissionsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUpdateMyCompanyJobSubmissionWithID:body:completionHandler:",
        [AccountitAPICPAJobSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUpdateMyCompanyJobSubmissionWithID:[self missingID] body:[self companyJobSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCancelMyCompanyJobSubmissionWithID:completionHandler:",
        [AccountitAPICPAJobSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCancelMyCompanyJobSubmissionWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMyCompanyJobsWithCompletionHandler:",
        [AccountitAPICPACompanyManagedJobListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMyCompanyJobsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCompanyJobEditSubmissionWithJobID:body:completionHandler:",
        [AccountitAPICPAJobSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCompanyJobEditSubmissionWithJobID:[self missingID] body:[self companyJobSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCloseMyCompanyJobWithID:completionHandler:",
        [AccountitAPICPACompanyManagedJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCloseMyCompanyJobWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCompanyLogoUploadURLWithBody:completionHandler:",
        [AccountitAPICPAUploadURLResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCompanyLogoUploadURLWithBody:[self uploadURLBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCompanyBackgroundUploadURLWithBody:completionHandler:",
        [AccountitAPICPAUploadURLResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCompanyBackgroundUploadURLWithBody:[self uploadURLBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateProfileImageUploadURLWithBody:completionHandler:",
        [AccountitAPICPAUploadURLResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateProfileImageUploadURLWithBody:[self uploadURLBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCompleteAssetUploadWithID:completionHandler:",
        [AccountitAPICPAAssetCompletionResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCompleteAssetUploadWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUploadLocalAssetWithID:data:contentType:completionHandler:",
        [AccountitAPICPAAssetItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUploadLocalAssetWithID:[self missingID] data:[self rawUploadData] contentType:@"application/octet-stream" completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaJobFilterPreferenceWithCompletionHandler:",
        [AccountitAPICPAJobFilterPreferenceResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaJobFilterPreferenceWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUpdateJobFilterPreferenceWithBody:completionHandler:",
        [AccountitAPICPAJobFilterPreferenceResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUpdateJobFilterPreferenceWithBody:[self jobFilterBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaJobPresetsWithCompletionHandler:",
        [AccountitAPICPAUserJobPresetListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaJobPresetsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateJobPresetWithBody:completionHandler:",
        [AccountitAPICPAUserJobPresetItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateJobPresetWithBody:[self jobPresetBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUseJobPresetWithID:completionHandler:",
        [AccountitAPICPAUserJobPresetItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUseJobPresetWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaDeleteJobPresetWithID:completionHandler:",
        [AccountitAPICPAUserJobPresetItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaDeleteJobPresetWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMyProfileWithCompletionHandler:",
        [AccountitAPICPAMyProfileResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMyProfileWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUpdateMyProfileWithBody:completionHandler:",
        [AccountitAPICPAMyProfileResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUpdateMyProfileWithBody:[self profileBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaDeleteMyProfileImageWithCompletionHandler:",
        [AccountitAPICPAMyProfileResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaDeleteMyProfileImageWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUpdatePasswordWithBody:completionHandler:",
        [AccountitAPICPAOkResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUpdatePasswordWithBody:[self passwordBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMyCommunityActivityWithQuery:completionHandler:",
        [AccountitAPICPAMyCommunityActivityListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMyCommunityActivityWithQuery:[self communityActivityQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreatePersonalVerificationRequestWithBody:completionHandler:",
        [AccountitAPICPAPersonalVerificationRequestItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreatePersonalVerificationRequestWithBody:[self personalVerificationBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaBookmarksWithQuery:completionHandler:",
        [AccountitAPICPABookmarkListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaBookmarksWithQuery:[self notificationsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateBookmarkWithBody:completionHandler:",
        [AccountitAPICPABookmarkItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateBookmarkWithBody:[self bookmarkBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaDeleteBookmarkWithID:completionHandler:",
        [AccountitAPICPAOkResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaDeleteBookmarkWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaJobFitAnalysesWithQuery:completionHandler:",
        [AccountitAPICPAJobFitAnalysisListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaJobFitAnalysesWithQuery:[self notificationsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaHighFitJobAnalysesWithQuery:completionHandler:",
        [AccountitAPICPAJobFitAnalysisListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaHighFitJobAnalysesWithQuery:[self notificationsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateJobFitAnalysisWithBody:completionHandler:",
        [AccountitAPICPACreateJobFitAnalysisResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateJobFitAnalysisWithBody:[self jobFitBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaResumesWithCompletionHandler:",
        [AccountitAPICPAResumeListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaResumesWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateResumeWithData:fileName:contentType:completionHandler:",
        [AccountitAPICPAResumeItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateResumeWithData:[self rawUploadData] fileName:@"resume.pdf" contentType:@"application/pdf" completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaDownloadResumeWithID:completionHandler:",
        [AccountitAPIFileDownloadResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaDownloadResumeWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaDeleteResumeWithID:completionHandler:",
        [AccountitAPICPAOkResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaDeleteResumeWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaSetPrimaryResumeWithID:completionHandler:",
        [AccountitAPICPAResumeItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaSetPrimaryResumeWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaNotificationsWithQuery:completionHandler:",
        [AccountitAPICPANotificationListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaNotificationsWithQuery:[self notificationsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaNotificationUnreadCountWithCompletionHandler:",
        [AccountitAPICPANotificationUnreadCountResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaNotificationUnreadCountWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMarkAllNotificationsReadWithCompletionHandler:",
        [AccountitAPICPANotificationReadAllResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMarkAllNotificationsReadWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaMarkNotificationReadWithID:completionHandler:",
        [AccountitAPICPANotificationItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaMarkNotificationReadWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaTagSubscriptionsWithCompletionHandler:",
        [AccountitAPICPATagSubscriptionListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaTagSubscriptionsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaSubscribeTagWithLabelID:completionHandler:",
        [AccountitAPICPATagSubscriptionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaSubscribeTagWithLabelID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaUnsubscribeTagWithLabelID:completionHandler:",
        [AccountitAPICPAOkResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaUnsubscribeTagWithLabelID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCommunityPostsWithQuery:completionHandler:",
        [AccountitAPICPACommunityPostListResponse class],
        YES,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCommunityPostsWithQuery:[self communityPostsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCommunityPostDetailWithID:completionHandler:",
        [AccountitAPICPACommunityPostDetailResponse class],
        NO,
        YES,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCommunityPostDetailWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCommunityPostWithBody:completionHandler:",
        [AccountitAPICPACommunityPostItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCommunityPostWithBody:[self communityPostBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaCreateCommunityAnswerWithPostID:body:completionHandler:",
        [AccountitAPICPACommunityAnswerItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaCreateCommunityAnswerWithPostID:[self missingID] body:[self communityAnswerBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaLikeCommunityPostWithID:completionHandler:",
        [AccountitAPICPACommunityPostItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaLikeCommunityPostWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaLikeCommunityAnswerWithID:completionHandler:",
        [AccountitAPICPACommunityAnswerItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaLikeCommunityAnswerWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaResolveCommunityPostWithID:body:completionHandler:",
        [AccountitAPICPACommunityPostDetailResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaResolveCommunityPostWithID:[self missingID] body:[self resolveCommunityPostBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminHealthWithCompletionHandler:",
        [AccountitAPICPAHealthResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminHealthWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminDashboardWithCompletionHandler:",
        [AccountitAPICPAAdminDashboardResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminDashboardWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminSourcesWithCompletionHandler:",
        [AccountitAPICPASourceListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminSourcesWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminJobsWithQuery:completionHandler:",
        [AccountitAPICPAAdminJobListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminJobsWithQuery:[self jobsQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminJobWithID:completionHandler:",
        [AccountitAPICPAAdminJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminJobWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminCreateJobWithBody:completionHandler:",
        [AccountitAPICPAAdminJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminCreateJobWithBody:[self adminJobBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminUpdateJobWithID:body:completionHandler:",
        [AccountitAPICPAAdminJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminUpdateJobWithID:[self missingID] body:[self adminJobBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminCloseJobWithID:completionHandler:",
        [AccountitAPICPAAdminJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminCloseJobWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminUpdateJobStatusWithID:body:completionHandler:",
        [AccountitAPICPAAdminJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminUpdateJobStatusWithID:[self missingID] body:[self adminJobStatusBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminRefreshJobWithID:completionHandler:",
        [AccountitAPICPAAdminJobItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminRefreshJobWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminAiSuggestionsWithCompletionHandler:",
        [AccountitAPICPAAiSuggestionListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminAiSuggestionsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminApproveAiSuggestionWithID:completionHandler:",
        [AccountitAPICPAAiSuggestionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminApproveAiSuggestionWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminRejectAiSuggestionWithID:completionHandler:",
        [AccountitAPICPAAiSuggestionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminRejectAiSuggestionWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminCompaniesWithQuery:completionHandler:",
        [AccountitAPICPAAdminCompanyListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminCompaniesWithQuery:[self companiesQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminCompanyWithID:completionHandler:",
        [AccountitAPICPAAdminCompanyItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminCompanyWithID:[self missingID] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminCreateCompanyWithBody:completionHandler:",
        [AccountitAPICPAAdminCompanyItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminCreateCompanyWithBody:[self adminCompanyBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminUpdateCompanyWithID:body:completionHandler:",
        [AccountitAPICPAAdminCompanyItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminUpdateCompanyWithID:[self missingID] body:[self adminCompanyBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminMembersWithQuery:completionHandler:",
        [AccountitAPICPAAdminMemberListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminMembersWithQuery:[self adminMembersQuery] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminPersonalVerificationRequestsWithCompletionHandler:",
        [AccountitAPICPAPersonalVerificationRequestListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminPersonalVerificationRequestsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminApprovePersonalVerificationRequestWithID:body:completionHandler:",
        [AccountitAPICPAPersonalVerificationRequestItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminApprovePersonalVerificationRequestWithID:[self missingID] body:[self reviewSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminRejectPersonalVerificationRequestWithID:body:completionHandler:",
        [AccountitAPICPAPersonalVerificationRequestItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminRejectPersonalVerificationRequestWithID:[self missingID] body:[self reviewSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminJobSubmissionsWithCompletionHandler:",
        [AccountitAPICPAJobSubmissionListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminJobSubmissionsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminApproveJobSubmissionWithID:body:completionHandler:",
        [AccountitAPICPAJobSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminApproveJobSubmissionWithID:[self missingID] body:[self reviewSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminRejectJobSubmissionWithID:body:completionHandler:",
        [AccountitAPICPAJobSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminRejectJobSubmissionWithID:[self missingID] body:[self reviewSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminProfileSubmissionsWithCompletionHandler:",
        [AccountitAPICPACompanyProfileSubmissionListResponse class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminProfileSubmissionsWithCompletionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminApproveProfileSubmissionWithID:body:completionHandler:",
        [AccountitAPICPACompanyProfileSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminApproveProfileSubmissionWithID:[self missingID] body:[self reviewSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaAdminRejectProfileSubmissionWithID:body:completionHandler:",
        [AccountitAPICPACompanyProfileSubmissionItem class],
        NO,
        NO,
        NO,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaAdminRejectProfileSubmissionWithID:[self missingID] body:[self reviewSubmissionBody] completionHandler:completionHandler];
        })];

    [specs addObject:_AccountitAPIServiceLiveSpecMake(
        @"cpaOpsDeployWithBody:bearerToken:completionHandler:",
        [AccountitAPICPAOpsDeployResponse class],
        NO,
        NO,
        YES,
        ^NSProgress *(id completionHandler) {
            return [AccountitAPIService cpaOpsDeployWithBody:[self opsDeployBody] bearerToken:@"invalid-token" completionHandler:completionHandler];
        })];

    return [specs autorelease];
}

- (void)testAllPublicAPIsReachLiveServer {
    NSArray<_AccountitAPIServiceLiveSpec *> *specs = [self allLiveEndpointSpecs];

    XCTAssertEqual([specs count], 95U);

    for (_AccountitAPIServiceLiveSpec *spec in specs) {
        [self performLiveSpec:spec];
    }
}

- (void)testLiveCookieAuthenticationUsesSetCookieAcrossRequests {
    AccountitAPIDTO *registerResponse = nil;
    NSError *registerError = nil;

    [self performInvocationNamed:@"live register"
                    responseClass:[AccountitAPICPAAuthUserResponse class]
                  requiresSuccess:YES
                   allowsNotFound:NO
                allowsServerError:NO
                       invocation:^NSProgress *(id completionHandler) {
        return [AccountitAPIService cpaRegisterWithBody:[self registerBody] completionHandler:completionHandler];
    }
                         response:&registerResponse
                            error:&registerError];

    XCTAssertNotNil(registerResponse);
    XCTAssertNil(registerError);

    [registerResponse release];
    [registerError release];

    AccountitAPIDTO *meResponse = nil;
    NSError *meError = nil;

    [self performInvocationNamed:@"live me after register cookie"
                    responseClass:[AccountitAPICPAAuthUserResponse class]
                  requiresSuccess:YES
                   allowsNotFound:NO
                allowsServerError:NO
                       invocation:^NSProgress *(id completionHandler) {
        return [AccountitAPIService cpaMeWithCompletionHandler:completionHandler];
    }
                         response:&meResponse
                            error:&meError];

    XCTAssertNotNil(meResponse);
    XCTAssertNil(meError);

    [meResponse release];
    [meError release];
}

- (void)performLiveSpec:(_AccountitAPIServiceLiveSpec *)spec {
    [self clearCookies];

    AccountitAPIDTO *response = nil;
    NSError *error = nil;

    [self performInvocationNamed:[spec name]
                    responseClass:[spec responseClass]
                  requiresSuccess:[spec requiresSuccess]
                   allowsNotFound:[spec allowsNotFound]
                allowsServerError:[spec allowsServerError]
                       invocation:[spec invocation]
                         response:&response
                            error:&error];

    [response release];
    [error release];
}

- (void)performInvocationNamed:(NSString *)name
                 responseClass:(Class)responseClass
               requiresSuccess:(BOOL)requiresSuccess
                allowsNotFound:(BOOL)allowsNotFound
             allowsServerError:(BOOL)allowsServerError
                    invocation:(AccountitAPIServiceLiveInvocation)invocation
                      response:(AccountitAPIDTO **)outResponse
                         error:(NSError **)outError {
    XCTestExpectation *expectation = [self expectationWithDescription:name];
    __block AccountitAPIDTO *capturedResponse = nil;
    __block NSError *capturedError = nil;

    NSProgress *progress = invocation(^(AccountitAPIDTO *response, NSError * __autoreleasing *error) {
        capturedResponse = [response retain];

        if (error && *error) {
            capturedError = [*error retain];
        }

        [expectation fulfill];
    });

    XCTAssertNotNil(progress, @"%@ did not return NSProgress", name);
    XCTAssertFalse([progress isCancelled], @"%@ returned already-cancelled progress", name);

    [self waitForExpectationsWithTimeout:10.0 handler:nil];

    if (requiresSuccess) {
        XCTAssertNil(capturedError, @"%@ should succeed against the live server", name);
        XCTAssertTrue([capturedResponse isKindOfClass:responseClass], @"%@ returned %@", name, capturedResponse);
    } else if (capturedError) {
        [self assertLiveError:capturedError
                         name:name
               allowsNotFound:allowsNotFound
            allowsServerError:allowsServerError];
    } else {
        XCTAssertTrue([capturedResponse isKindOfClass:responseClass], @"%@ returned %@", name, capturedResponse);
    }

    if (outResponse) {
        *outResponse = [capturedResponse retain];
    }

    if (outError) {
        *outError = [capturedError retain];
    }

    [capturedResponse release];
    [capturedError release];
}

- (void)assertLiveError:(NSError *)error
                   name:(NSString *)name
         allowsNotFound:(BOOL)allowsNotFound
      allowsServerError:(BOOL)allowsServerError {
    if ([[error domain] isEqualToString:NSURLErrorDomain]) {
        XCTFail(@"%@ failed before reaching the live server: %@", name, error);
        return;
    }

    XCTAssertEqualObjects([error domain], AccountitAPIErrorDomain, @"%@ should map live HTTP errors", name);

    NSNumber *statusCode = [[error userInfo] objectForKey:AccountitAPIHTTPStatusCodeKey];
    XCTAssertNotNil(statusCode, @"%@ did not expose an HTTP status code", name);

    NSInteger status = [statusCode integerValue];
    XCTAssertGreaterThanOrEqual(status, 400, @"%@ should either succeed or expose a non-2xx live status", name);

    if (!allowsNotFound) {
        XCTAssertNotEqual(status, 404, @"%@ reached a missing live route", name);
    }

    if (!allowsServerError) {
        XCTAssertLessThan(status, 500, @"%@ hit a live server error", name);
    }

    AccountitAPIErrorResponse *errorResponse = [[error userInfo] objectForKey:AccountitAPIErrorResponseKey];
    XCTAssertTrue([errorResponse isKindOfClass:[AccountitAPIErrorResponse class]], @"%@ did not decode an error DTO", name);
    XCTAssertEqual([errorResponse statusCode], status, @"%@ status mismatch", name);
}

@end
