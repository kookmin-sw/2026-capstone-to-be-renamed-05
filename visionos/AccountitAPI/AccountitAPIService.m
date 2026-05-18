#import <AccountitAPI/AccountitAPIService.h>
#import <AccountitAPI/AccountitAPICPAAdminCompanyListResponse.h>
#import <AccountitAPI/AccountitAPICPAAdminDashboardResponse.h>
#import <AccountitAPI/AccountitAPICPAAdminJobListResponse.h>
#import <AccountitAPI/AccountitAPICPAAdminMemberListResponse.h>
#import <AccountitAPI/AccountitAPICPAAiSuggestionListResponse.h>
#import <AccountitAPI/AccountitAPICPAAssetCompletionResponse.h>
#import <AccountitAPI/AccountitAPICPAAuthUserResponse.h>
#import <AccountitAPI/AccountitAPICPABookmarkListResponse.h>
#import <AccountitAPI/AccountitAPICPACommunityPostDetailResponse.h>
#import <AccountitAPI/AccountitAPICPACommunityPostListResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyAnalyticsDashboardResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyDashboardResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyJobAutofillResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyListResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyManagedJobListResponse.h>
#import <AccountitAPI/AccountitAPICPACompanyProfileSubmissionListResponse.h>
#import <AccountitAPI/AccountitAPICPACreateJobFitAnalysisResponse.h>
#import <AccountitAPI/AccountitAPICPAHealthResponse.h>
#import <AccountitAPI/AccountitAPICPAJobCalendarResponse.h>
#import <AccountitAPI/AccountitAPICPAJobDetailResponse.h>
#import <AccountitAPI/AccountitAPICPAJobFilterPreferenceResponse.h>
#import <AccountitAPI/AccountitAPICPAJobFitAnalysisListResponse.h>
#import <AccountitAPI/AccountitAPICPAJobListResponse.h>
#import <AccountitAPI/AccountitAPICPAJobSubmissionListResponse.h>
#import <AccountitAPI/AccountitAPICPAMyCommunityActivityListResponse.h>
#import <AccountitAPI/AccountitAPICPAMyProfileResponse.h>
#import <AccountitAPI/AccountitAPICPANotificationListResponse.h>
#import <AccountitAPI/AccountitAPICPANotificationReadAllResponse.h>
#import <AccountitAPI/AccountitAPICPANotificationUnreadCountResponse.h>
#import <AccountitAPI/AccountitAPICPAOkResponse.h>
#import <AccountitAPI/AccountitAPICPAOpsDeployResponse.h>
#import <AccountitAPI/AccountitAPICPAPersonalVerificationRequestListResponse.h>
#import <AccountitAPI/AccountitAPICPAResumeListResponse.h>
#import <AccountitAPI/AccountitAPICPASourceListResponse.h>
#import <AccountitAPI/AccountitAPICPATagSubscriptionListResponse.h>
#import <AccountitAPI/AccountitAPICPAUploadURLResponse.h>
#import <AccountitAPI/AccountitAPICPAUserJobPresetListResponse.h>
#import <AccountitAPI/AccountitAPIErrorResponse.h>
#import <AccountitAPI/AccountitAPIFileDownloadResponse.h>

NSString * _Nonnull const AccountitAPIErrorDomain = @"AccountitAPIErrorDomain";
NSString * _Nonnull const AccountitAPIErrorResponseKey = @"AccountitAPIErrorResponse";
NSString * _Nonnull const AccountitAPIHTTPStatusCodeKey = @"AccountitAPIHTTPStatusCode";

typedef void (^_AccountitAPIServiceCompletionHandler)(AccountitAPIDTO * _Nullable response, NSError * __autoreleasing * _Nullable error);

@interface _AccountitAPITaskBox : NSObject
@property (nonatomic, retain) NSURLSessionTask * _Nullable task;
@end

@implementation _AccountitAPITaskBox

@synthesize task = _task;

- (void)dealloc {
    [_task release];
    [super dealloc];
}

@end

@interface AccountitAPIService ()

@property (class, readonly, nonatomic, direct) NSURL * _Nonnull _cpaBaseURL;

+ (NSString * _Nullable)_queryStringValue:(id _Nullable)value __attribute__((objc_direct));
+ (NSString * _Nonnull)_escapedPathComponent:(NSString * _Nonnull)value __attribute__((objc_direct));
+ (NSString * _Nonnull)_pathWithFormat:(NSString * _Nonnull)format, ... __attribute__((objc_direct));
+ (NSURL * _Nonnull)_URLWithPath:(NSString * _Nonnull)path
                            query:(NSDictionary<NSString *, id> * _Nullable)query __attribute__((objc_direct));
+ (void)_callCompletionHandler:(_AccountitAPIServiceCompletionHandler _Nullable)completionHandler
                      response:(AccountitAPIDTO * _Nullable)response
                         error:(NSError * _Nullable)error __attribute__((objc_direct));
+ (AccountitAPIDTO * _Nullable)_newResponseDTOWithClass:(Class _Nonnull)responseClass
                                                   data:(NSData * _Nonnull)data
                                               response:(NSURLResponse * _Nullable)response
                                   statusCode:(NSInteger)statusCode
                                                  error:(NSError * _Nullable * _Nonnull)error __attribute__((objc_direct));
+ (NSError * _Nonnull)_newHTTPErrorWithStatusCode:(NSInteger)statusCode
                                             data:(NSData * _Nonnull)data
                                         response:(NSURLResponse * _Nullable)response __attribute__((objc_direct));
+ (NSProgress * _Nonnull)_requestWithMethod:(NSString * _Nonnull)method
                                       path:(NSString * _Nonnull)path
                                      query:(NSDictionary<NSString *, id> * _Nullable)query
                                       body:(NSDictionary<NSString *, id> * _Nullable)body
                                    rawBody:(NSData * _Nullable)rawBody
                             rawContentType:(NSString * _Nullable)rawContentType
                                    headers:(NSDictionary<NSString *, NSString *> * _Nullable)headers
                              responseClass:(Class _Nullable)responseClass
                          completionHandler:(_AccountitAPIServiceCompletionHandler _Nullable)completionHandler __attribute__((objc_direct));
+ (NSProgress * _Nonnull)_JSONRequestWithMethod:(NSString * _Nonnull)method
                                           path:(NSString * _Nonnull)path
                                          query:(NSDictionary<NSString *, id> * _Nullable)query
                                           body:(NSDictionary<NSString *, id> * _Nullable)body
                                  responseClass:(Class _Nonnull)responseClass
                              completionHandler:(_AccountitAPIServiceCompletionHandler _Nullable)completionHandler __attribute__((objc_direct));

@end

@implementation AccountitAPIService

+ (NSURL * _Nonnull)_cpaBaseURL __attribute__((objc_direct)) {
    return [[[NSURL alloc] initWithString:@"http://localhost:4000"] autorelease];
}

+ (NSString * _Nullable)_queryStringValue:(id _Nullable)value __attribute__((objc_direct)) {
    if ([value isKindOfClass:[NSNull class]]) {
        return nil;
    }

    if (!value) {
        return nil;
    }

    if ([value isKindOfClass:[NSString class]]) {
        return value;
    }

    if ([value isKindOfClass:[NSNumber class]]) {
        return [(NSNumber *)value stringValue];
    }

    return [value description];
}

+ (NSString * _Nonnull)_escapedPathComponent:(NSString * _Nonnull)value __attribute__((objc_direct)) {
    NSCharacterSet *allowedCharacters = [[NSCharacterSet URLPathAllowedCharacterSet] retain];
    NSString *escapedValue = [[value stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters] retain];

    [allowedCharacters release];

    return [escapedValue autorelease];
}

+ (NSString * _Nonnull)_pathWithFormat:(NSString * _Nonnull)format, ... __attribute__((objc_direct)) {
    va_list arguments;
    va_start(arguments, format);

    NSString *path = [[NSString alloc] initWithFormat:format arguments:arguments];

    va_end(arguments);

    return [path autorelease];
}

+ (NSURL * _Nonnull)_URLWithPath:(NSString * _Nonnull)path
                            query:(NSDictionary<NSString *, id> * _Nullable)query __attribute__((objc_direct)) {
    NSURL *baseURL = [AccountitAPIService _cpaBaseURL];
    NSURL *relativeURL = [[NSURL alloc] initWithString:path relativeToURL:baseURL];
    NSURLComponents *components = [[NSURLComponents alloc] initWithURL:relativeURL resolvingAgainstBaseURL:YES];

    [relativeURL release];

    if ([query count] > 0) {
        NSMutableArray *queryItems = [[NSMutableArray alloc] init];
        NSArray *keys = [[query allKeys] sortedArrayUsingSelector:@selector(compare:)];

        for (NSString *key in keys) {
            id value = [query objectForKey:key];

            if ([value isKindOfClass:[NSArray class]]) {
                for (id item in (NSArray *)value) {
                    NSString *stringValue = [AccountitAPIService _queryStringValue:item];

                    if (!stringValue) {
                        continue;
                    }

                    NSURLQueryItem *queryItem = [[NSURLQueryItem alloc] initWithName:key value:stringValue];
                    [queryItems addObject:queryItem];
                    [queryItem release];
                }
            } else {
                NSString *stringValue = [AccountitAPIService _queryStringValue:value];

                if (!stringValue) {
                    continue;
                }

                NSURLQueryItem *queryItem = [[NSURLQueryItem alloc] initWithName:key value:stringValue];
                [queryItems addObject:queryItem];
                [queryItem release];
            }
        }

        [components setQueryItems:queryItems];
        [queryItems release];
    }

    NSURL *URL = [[components URL] retain];
    [components release];

    return [URL autorelease];
}

+ (void)_callCompletionHandler:(_AccountitAPIServiceCompletionHandler _Nullable)completionHandler
                      response:(AccountitAPIDTO * _Nullable)response
                         error:(NSError * _Nullable)error __attribute__((objc_direct)) {
    if (!completionHandler) {
        return;
    }

    if (error) {
        NSError *retainedError = [error retain];
        completionHandler(response, &retainedError);
        [retainedError release];
        return;
    }

    completionHandler(response, NULL);
}

+ (AccountitAPIDTO * _Nullable)_newResponseDTOWithClass:(Class _Nonnull)responseClass
                                                   data:(NSData * _Nonnull)data
                                               response:(NSURLResponse * _Nullable)response
                                   statusCode:(NSInteger)statusCode
                                                  error:(NSError * _Nullable * _Nonnull)error __attribute__((objc_direct)) {
    if (responseClass == [AccountitAPIFileDownloadResponse class]) {
        return [[AccountitAPIFileDownloadResponse alloc] initWithData:data response:response];
    }

    NSDictionary *dictionary = nil;

    if ([data length] == 0) {
        NSMutableDictionary *emptyDictionary = [[NSMutableDictionary alloc] init];

        if (statusCode >= 200 && statusCode < 300) {
            [emptyDictionary setObject:[NSNumber numberWithBool:YES] forKey:@"ok"];
        }

        dictionary = emptyDictionary;
    } else {
        id JSONObject = [NSJSONSerialization JSONObjectWithData:data options:0 error:error];

        if (*error) {
            return nil;
        }

        if ([JSONObject isKindOfClass:[NSDictionary class]]) {
            dictionary = [JSONObject retain];
        } else if ([JSONObject isKindOfClass:[NSArray class]]) {
            NSMutableDictionary *wrapper = [[NSMutableDictionary alloc] init];
            [wrapper setObject:JSONObject forKey:@"items"];
            [wrapper setObject:[NSNumber numberWithUnsignedInteger:[(NSArray *)JSONObject count]] forKey:@"total"];
            dictionary = wrapper;
        } else {
            NSMutableDictionary *wrapper = [[NSMutableDictionary alloc] init];
            [wrapper setObject:[NSNumber numberWithBool:YES] forKey:@"ok"];
            dictionary = wrapper;
        }
    }

    AccountitAPIDTO *DTO = [[responseClass alloc] initWithDictionary:dictionary];
    [dictionary release];

    return DTO;
}

+ (NSError * _Nonnull)_newHTTPErrorWithStatusCode:(NSInteger)statusCode
                                             data:(NSData * _Nonnull)data
                                         response:(NSURLResponse * _Nullable)response __attribute__((objc_direct)) {
    NSError *parseError = nil;
    AccountitAPIErrorResponse *errorResponse = (AccountitAPIErrorResponse *)[AccountitAPIService _newResponseDTOWithClass:[AccountitAPIErrorResponse class]
                                                                                                      data:data
                                                                                                  response:response
                                                                                                statusCode:statusCode
                                                                                                     error:&parseError];

    if (!errorResponse) {
        NSMutableDictionary *fallback = [[NSMutableDictionary alloc] init];
        [fallback setObject:[NSNumber numberWithInteger:statusCode] forKey:@"statusCode"];
        [fallback setObject:@"HTTP_ERROR" forKey:@"errorCode"];
        [fallback setObject:[NSHTTPURLResponse localizedStringForStatusCode:statusCode] forKey:@"message"];

        errorResponse = [[AccountitAPIErrorResponse alloc] initWithDictionary:fallback];
        [fallback release];
    }

    NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
    [userInfo setObject:[NSNumber numberWithInteger:statusCode] forKey:AccountitAPIHTTPStatusCodeKey];
    [userInfo setObject:errorResponse forKey:AccountitAPIErrorResponseKey];

    NSString *message = [errorResponse message];

    if (message) {
        [userInfo setObject:message forKey:NSLocalizedDescriptionKey];
    }

    NSError *error = [[NSError alloc] initWithDomain:AccountitAPIErrorDomain
                                               code:statusCode
                                           userInfo:userInfo];

    [userInfo release];
    [errorResponse release];

    return error;
}

+ (NSProgress * _Nonnull)_requestWithMethod:(NSString * _Nonnull)method
                                       path:(NSString * _Nonnull)path
                                      query:(NSDictionary<NSString *, id> * _Nullable)query
                                       body:(NSDictionary<NSString *, id> * _Nullable)body
                                    rawBody:(NSData * _Nullable)rawBody
                             rawContentType:(NSString * _Nullable)rawContentType
                                    headers:(NSDictionary<NSString *, NSString *> * _Nullable)headers
                              responseClass:(Class _Nullable)responseClass
                          completionHandler:(_AccountitAPIServiceCompletionHandler _Nullable)completionHandler __attribute__((objc_direct)) {
    NSProgress *progress = [[NSProgress alloc] initWithParent:nil userInfo:nil];
    [progress setTotalUnitCount:1];
    [progress setCompletedUnitCount:0];

    NSURL *URL = [AccountitAPIService _URLWithPath:path query:query];
    NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:URL
                                                                cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                                                            timeoutInterval:60.0];
    [request setHTTPMethod:method];
    [request setHTTPShouldHandleCookies:YES];
    [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];

    if (body) {
        NSError *jsonError = nil;
        NSData *bodyData = [NSJSONSerialization dataWithJSONObject:body
                                                           options:0
                                                             error:&jsonError];

        if (jsonError) {
            [AccountitAPIService _callCompletionHandler:completionHandler response:nil error:jsonError];
            [request release];
            return [progress autorelease];
        }

        [request setHTTPBody:bodyData];
        [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    } else if (rawBody) {
        [request setHTTPBody:rawBody];

        if (rawContentType) {
            [request setValue:rawContentType forHTTPHeaderField:@"Content-Type"];
        }
    }

    for (NSString *key in headers) {
        [request setValue:[headers objectForKey:key] forHTTPHeaderField:key];
    }

    NSURLSessionConfiguration *configuration = [[NSURLSessionConfiguration defaultSessionConfiguration] retain];
    [configuration setHTTPCookieStorage:[NSHTTPCookieStorage sharedHTTPCookieStorage]];
    [configuration setHTTPShouldSetCookies:YES];
    [configuration setHTTPCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];

    NSURLSession *session = [[NSURLSession sessionWithConfiguration:configuration] retain];
    [configuration release];

    _AccountitAPITaskBox *taskBox = [[_AccountitAPITaskBox alloc] init];

    [progress setCancellationHandler:^{
        [[taskBox task] cancel];
    }];

    NSURLSessionDataTask *task = [[session dataTaskWithRequest:request
                                             completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        [progress setCancellationHandler:nil];
        [progress setCompletedUnitCount:[progress totalUnitCount]];
        [taskBox setTask:nil];

        if (error) {
            [AccountitAPIService _callCompletionHandler:completionHandler response:nil error:error];
            [session finishTasksAndInvalidate];
            [session release];
            return;
        }

        NSInteger statusCode = 0;

        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
            statusCode = [(NSHTTPURLResponse *)response statusCode];
        }

        NSData *responseData = data;

        if (!responseData) {
            responseData = [NSData data];
        }

        if (statusCode < 200 || statusCode >= 300) {
            NSError *httpError = [AccountitAPIService _newHTTPErrorWithStatusCode:statusCode
                                                              data:responseData
                                                          response:response];

            [AccountitAPIService _callCompletionHandler:completionHandler response:nil error:httpError];
            [httpError release];
            [session finishTasksAndInvalidate];
            [session release];
            return;
        }

        NSError *parseError = nil;
        Class effectiveResponseClass = responseClass ?: [AccountitAPIDTO class];
        AccountitAPIDTO *DTO = [AccountitAPIService _newResponseDTOWithClass:effectiveResponseClass
                                                         data:responseData
                                                     response:response
                                                   statusCode:statusCode
                                                        error:&parseError];

        if (parseError) {
            [AccountitAPIService _callCompletionHandler:completionHandler response:nil error:parseError];
        } else {
            [AccountitAPIService _callCompletionHandler:completionHandler response:DTO error:nil];
        }

        [DTO release];
        [session finishTasksAndInvalidate];
        [session release];
    }] retain];

    [taskBox setTask:task];
    [task resume];
    [task release];
    [taskBox release];
    [request release];

    return [progress autorelease];
}

+ (NSProgress * _Nonnull)_JSONRequestWithMethod:(NSString * _Nonnull)method
                                           path:(NSString * _Nonnull)path
                                          query:(NSDictionary<NSString *, id> * _Nullable)query
                                           body:(NSDictionary<NSString *, id> * _Nullable)body
                                  responseClass:(Class _Nonnull)responseClass
                              completionHandler:(_AccountitAPIServiceCompletionHandler _Nullable)completionHandler __attribute__((objc_direct)) {
    return [AccountitAPIService _requestWithMethod:method
                               path:path
                              query:query
                               body:body
                            rawBody:nil
                     rawContentType:nil
                            headers:nil
                      responseClass:responseClass
                  completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaHealthWithCompletionHandler:(AccountitAPICPAHealthResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAHealthResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaHealthzWithCompletionHandler:(AccountitAPICPAHealthResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/healthz"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAHealthResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaRegisterWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                   completionHandler:(AccountitAPICPAAuthUserResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/auth/register"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAuthUserResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaLoginWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                completionHandler:(AccountitAPICPAAuthUserResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/auth/login"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAuthUserResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMeWithCompletionHandler:(AccountitAPICPAAuthUserResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/auth/me"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAuthUserResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaLogoutWithCompletionHandler:(AccountitAPICPAOkResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/auth/logout"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAOkResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaJobsWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
               completionHandler:(AccountitAPICPAJobListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/jobs"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAJobListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaJobCalendarWithQuery:(NSDictionary<NSString *, id> * _Nonnull)query
                      completionHandler:(AccountitAPICPAJobCalendarResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/jobs/calendar"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAJobCalendarResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaJobDetailWithID:(NSString * _Nonnull)jobID
                 completionHandler:(AccountitAPICPAJobDetailResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/jobs/%@", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAJobDetailResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaRecordJobEngagementWithJobID:(NSString * _Nonnull)jobID
                                           body:(NSDictionary<NSString *, id> * _Nonnull)body
                              completionHandler:(AccountitAPICPAOkResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/jobs/%@/engagements", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAOkResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCompaniesWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                    completionHandler:(AccountitAPICPACompanyListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/companies"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPACompanyListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCompanyDetailWithID:(NSString * _Nonnull)companyID
                     completionHandler:(AccountitAPICPACompanyDetailItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/companies/%@", [AccountitAPIService _escapedPathComponent:companyID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACompanyDetailItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMyCompanyWithCompletionHandler:(AccountitAPICPACompanyDashboardResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/companies/me"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACompanyDashboardResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMyCompanyAnalyticsWithCompletionHandler:(AccountitAPICPACompanyAnalyticsDashboardResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/companies/me/analytics"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACompanyAnalyticsDashboardResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCompanyProfileSubmissionWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                        completionHandler:(AccountitAPICPACompanyProfileSubmissionItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/companies/me/profile-submissions"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACompanyProfileSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUpdateCompanyLogoWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                           completionHandler:(AccountitAPICPACompanyDetailItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:@"/companies/me/logo"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACompanyDetailItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUpdateCompanyBackgroundWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                 completionHandler:(AccountitAPICPACompanyDetailItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:@"/companies/me/background"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACompanyDetailItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCompanyJobAutofillDraftWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                       completionHandler:(AccountitAPICPACompanyJobAutofillResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/companies/me/job-submissions/ai-draft"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACompanyJobAutofillResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCompanyJobSubmissionWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                    completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/companies/me/job-submissions"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAJobSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMyCompanyJobSubmissionsWithCompletionHandler:(AccountitAPICPAJobSubmissionListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/companies/me/job-submissions"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAJobSubmissionListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUpdateMyCompanyJobSubmissionWithID:(NSString * _Nonnull)submissionID
                                                 body:(NSDictionary<NSString *, id> * _Nonnull)body
                                    completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/companies/me/job-submissions/%@", [AccountitAPIService _escapedPathComponent:submissionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAJobSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCancelMyCompanyJobSubmissionWithID:(NSString * _Nonnull)submissionID
                                    completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/companies/me/job-submissions/%@", [AccountitAPIService _escapedPathComponent:submissionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAJobSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMyCompanyJobsWithCompletionHandler:(AccountitAPICPACompanyManagedJobListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/companies/me/jobs"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACompanyManagedJobListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCompanyJobEditSubmissionWithJobID:(NSString * _Nonnull)jobID
                                                      body:(NSDictionary<NSString *, id> * _Nonnull)body
                                         completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/companies/me/jobs/%@/edit-submissions", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAJobSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCloseMyCompanyJobWithID:(NSString * _Nonnull)jobID
                         completionHandler:(AccountitAPICPACompanyManagedJobItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/companies/me/jobs/%@", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACompanyManagedJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCompanyLogoUploadURLWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                    completionHandler:(AccountitAPICPAUploadURLResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/assets/company-logo/upload-url"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAUploadURLResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCompanyBackgroundUploadURLWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                          completionHandler:(AccountitAPICPAUploadURLResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/assets/company-background/upload-url"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAUploadURLResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateProfileImageUploadURLWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                     completionHandler:(AccountitAPICPAUploadURLResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/assets/profile-image/upload-url"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAUploadURLResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCompleteAssetUploadWithID:(NSString * _Nonnull)assetID
                           completionHandler:(AccountitAPICPAAssetCompletionResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/assets/%@/complete", [AccountitAPIService _escapedPathComponent:assetID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAssetCompletionResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUploadLocalAssetWithID:(NSString * _Nonnull)assetID
                                     data:(NSData * _Nonnull)data
                              contentType:(NSString * _Nonnull)contentType
                        completionHandler:(AccountitAPICPAAssetItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/assets/%@/local-upload", [AccountitAPIService _escapedPathComponent:assetID]];

    return [AccountitAPIService _requestWithMethod:@"PUT"
                               path:path
                              query:nil
                               body:nil
                            rawBody:data
                     rawContentType:contentType
                            headers:nil
                      responseClass:[AccountitAPICPAAssetItem class]
                  completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaJobFilterPreferenceWithCompletionHandler:(AccountitAPICPAJobFilterPreferenceResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/users/me/job-filter"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAJobFilterPreferenceResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUpdateJobFilterPreferenceWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                   completionHandler:(AccountitAPICPAJobFilterPreferenceResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:@"/users/me/job-filter"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAJobFilterPreferenceResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaJobPresetsWithCompletionHandler:(AccountitAPICPAUserJobPresetListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/users/me/job-presets"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAUserJobPresetListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateJobPresetWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                         completionHandler:(AccountitAPICPAUserJobPresetItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/users/me/job-presets"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAUserJobPresetItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUseJobPresetWithID:(NSString * _Nonnull)presetID
                    completionHandler:(AccountitAPICPAUserJobPresetItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/users/me/job-presets/%@/use", [AccountitAPIService _escapedPathComponent:presetID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAUserJobPresetItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaDeleteJobPresetWithID:(NSString * _Nonnull)presetID
                       completionHandler:(AccountitAPICPAUserJobPresetItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/users/me/job-presets/%@", [AccountitAPIService _escapedPathComponent:presetID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAUserJobPresetItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMyProfileWithCompletionHandler:(AccountitAPICPAMyProfileResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/mypage/profile"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAMyProfileResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUpdateMyProfileWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                         completionHandler:(AccountitAPICPAMyProfileResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:@"/mypage/profile"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAMyProfileResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaDeleteMyProfileImageWithCompletionHandler:(AccountitAPICPAMyProfileResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:@"/mypage/profile/image"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAMyProfileResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUpdatePasswordWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                        completionHandler:(AccountitAPICPAOkResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:@"/mypage/password"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAOkResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMyCommunityActivityWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                              completionHandler:(AccountitAPICPAMyCommunityActivityListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/mypage/community-activity"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAMyCommunityActivityListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreatePersonalVerificationRequestWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                                           completionHandler:(AccountitAPICPAPersonalVerificationRequestItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/mypage/cpa-verification-requests"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAPersonalVerificationRequestItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaBookmarksWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                    completionHandler:(AccountitAPICPABookmarkListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/mypage/bookmarks"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPABookmarkListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateBookmarkWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                        completionHandler:(AccountitAPICPABookmarkItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/mypage/bookmarks"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPABookmarkItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaDeleteBookmarkWithID:(NSString * _Nonnull)bookmarkID
                      completionHandler:(AccountitAPICPAOkResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/mypage/bookmarks/%@", [AccountitAPIService _escapedPathComponent:bookmarkID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAOkResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaJobFitAnalysesWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                         completionHandler:(AccountitAPICPAJobFitAnalysisListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/mypage/job-fit-analyses"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAJobFitAnalysisListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaHighFitJobAnalysesWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                             completionHandler:(AccountitAPICPAJobFitAnalysisListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/mypage/job-fit-analyses/high-fit"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAJobFitAnalysisListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateJobFitAnalysisWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                              completionHandler:(AccountitAPICPACreateJobFitAnalysisResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/mypage/job-fit-analyses"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACreateJobFitAnalysisResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaResumesWithCompletionHandler:(AccountitAPICPAResumeListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/mypage/resumes"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAResumeListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateResumeWithData:(NSData * _Nonnull)data
                               fileName:(NSString * _Nonnull)fileName
                            contentType:(NSString * _Nonnull)contentType
                      completionHandler:(AccountitAPICPAResumeItemCompletionHandler _Nonnull)completionHandler {
    NSString *encodedFileName = [fileName stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]];
    NSDictionary *headers = [[NSDictionary alloc] initWithObjectsAndKeys:encodedFileName ?: fileName, @"x-file-name", nil];
    NSProgress *progress = [AccountitAPIService _requestWithMethod:@"POST"
                                               path:@"/mypage/resumes"
                                              query:nil
                                               body:nil
                                            rawBody:data
                                     rawContentType:contentType
                                            headers:headers
                                      responseClass:[AccountitAPICPAResumeItem class]
                                  completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];

    [headers release];

    return progress;
}

+ (NSProgress * _Nonnull)cpaDownloadResumeWithID:(NSString * _Nonnull)resumeID
                      completionHandler:(AccountitAPIFileDownloadResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/mypage/resumes/%@/download", [AccountitAPIService _escapedPathComponent:resumeID]];

    return [AccountitAPIService _requestWithMethod:@"GET"
                               path:path
                              query:nil
                               body:nil
                            rawBody:nil
                     rawContentType:nil
                            headers:nil
                      responseClass:[AccountitAPIFileDownloadResponse class]
                  completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaDeleteResumeWithID:(NSString * _Nonnull)resumeID
                    completionHandler:(AccountitAPICPAOkResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/mypage/resumes/%@", [AccountitAPIService _escapedPathComponent:resumeID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAOkResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaSetPrimaryResumeWithID:(NSString * _Nonnull)resumeID
                        completionHandler:(AccountitAPICPAResumeItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/mypage/resumes/%@/primary", [AccountitAPIService _escapedPathComponent:resumeID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAResumeItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaNotificationsWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                        completionHandler:(AccountitAPICPANotificationListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/notifications"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPANotificationListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaNotificationUnreadCountWithCompletionHandler:(AccountitAPICPANotificationUnreadCountResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/notifications/unread-count"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPANotificationUnreadCountResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMarkAllNotificationsReadWithCompletionHandler:(AccountitAPICPANotificationReadAllResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:@"/notifications/read-all"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPANotificationReadAllResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaMarkNotificationReadWithID:(NSString * _Nonnull)notificationID
                            completionHandler:(AccountitAPICPANotificationItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/notifications/%@/read", [AccountitAPIService _escapedPathComponent:notificationID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPANotificationItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaTagSubscriptionsWithCompletionHandler:(AccountitAPICPATagSubscriptionListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/notifications/tag-subscriptions"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPATagSubscriptionListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaSubscribeTagWithLabelID:(NSString * _Nonnull)labelID
                         completionHandler:(AccountitAPICPATagSubscriptionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/notifications/tag-subscriptions/%@", [AccountitAPIService _escapedPathComponent:labelID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PUT"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPATagSubscriptionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaUnsubscribeTagWithLabelID:(NSString * _Nonnull)labelID
                           completionHandler:(AccountitAPICPAOkResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/notifications/tag-subscriptions/%@", [AccountitAPIService _escapedPathComponent:labelID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"DELETE"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAOkResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCommunityPostsWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                         completionHandler:(AccountitAPICPACommunityPostListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/community/posts"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPACommunityPostListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCommunityPostDetailWithID:(NSString * _Nonnull)postID
                           completionHandler:(AccountitAPICPACommunityPostDetailResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/community/posts/%@", [AccountitAPIService _escapedPathComponent:postID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACommunityPostDetailResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCommunityPostWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                             completionHandler:(AccountitAPICPACommunityPostItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/community/posts"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACommunityPostItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaCreateCommunityAnswerWithPostID:(NSString * _Nonnull)postID
                                              body:(NSDictionary<NSString *, id> * _Nonnull)body
                                 completionHandler:(AccountitAPICPACommunityAnswerItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/community/posts/%@/answers", [AccountitAPIService _escapedPathComponent:postID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACommunityAnswerItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaLikeCommunityPostWithID:(NSString * _Nonnull)postID
                         completionHandler:(AccountitAPICPACommunityPostItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/community/posts/%@/like", [AccountitAPIService _escapedPathComponent:postID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACommunityPostItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaLikeCommunityAnswerWithID:(NSString * _Nonnull)answerID
                           completionHandler:(AccountitAPICPACommunityAnswerItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/community/answers/%@/like", [AccountitAPIService _escapedPathComponent:answerID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACommunityAnswerItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaResolveCommunityPostWithID:(NSString * _Nonnull)postID
                                         body:(NSDictionary<NSString *, id> * _Nonnull)body
                            completionHandler:(AccountitAPICPACommunityPostDetailResponseCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/community/posts/%@/resolve", [AccountitAPIService _escapedPathComponent:postID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACommunityPostDetailResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminHealthWithCompletionHandler:(AccountitAPICPAHealthResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/health"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAHealthResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminDashboardWithCompletionHandler:(AccountitAPICPAAdminDashboardResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/dashboard"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAdminDashboardResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminSourcesWithCompletionHandler:(AccountitAPICPASourceListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/sources"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPASourceListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminJobsWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                    completionHandler:(AccountitAPICPAAdminJobListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/jobs"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAAdminJobListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminJobWithID:(NSString * _Nonnull)jobID
                completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/jobs/%@", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAdminJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminCreateJobWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                        completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/admin/jobs"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAdminJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminUpdateJobWithID:(NSString * _Nonnull)jobID
                                   body:(NSDictionary<NSString *, id> * _Nonnull)body
                      completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/jobs/%@", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAdminJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminCloseJobWithID:(NSString * _Nonnull)jobID
                     completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/jobs/%@/close", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAdminJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminUpdateJobStatusWithID:(NSString * _Nonnull)jobID
                                         body:(NSDictionary<NSString *, id> * _Nonnull)body
                            completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/jobs/%@/status", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAdminJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminRefreshJobWithID:(NSString * _Nonnull)jobID
                       completionHandler:(AccountitAPICPAAdminJobItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/jobs/%@/refresh", [AccountitAPIService _escapedPathComponent:jobID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAdminJobItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminAiSuggestionsWithCompletionHandler:(AccountitAPICPAAiSuggestionListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/ai-suggestions"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAiSuggestionListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminApproveAiSuggestionWithID:(NSString * _Nonnull)suggestionID
                                completionHandler:(AccountitAPICPAAiSuggestionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/ai-suggestions/%@/approve", [AccountitAPIService _escapedPathComponent:suggestionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAiSuggestionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminRejectAiSuggestionWithID:(NSString * _Nonnull)suggestionID
                               completionHandler:(AccountitAPICPAAiSuggestionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/ai-suggestions/%@/reject", [AccountitAPIService _escapedPathComponent:suggestionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAiSuggestionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminCompaniesWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                         completionHandler:(AccountitAPICPAAdminCompanyListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/companies"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAAdminCompanyListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminCompanyWithID:(NSString * _Nonnull)companyID
                    completionHandler:(AccountitAPICPAAdminCompanyItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/companies/%@", [AccountitAPIService _escapedPathComponent:companyID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:path
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAAdminCompanyItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminCreateCompanyWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                            completionHandler:(AccountitAPICPAAdminCompanyItemCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"POST"
                                   path:@"/admin/companies"
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAdminCompanyItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminUpdateCompanyWithID:(NSString * _Nonnull)companyID
                                       body:(NSDictionary<NSString *, id> * _Nonnull)body
                          completionHandler:(AccountitAPICPAAdminCompanyItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/companies/%@", [AccountitAPIService _escapedPathComponent:companyID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAAdminCompanyItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminMembersWithQuery:(NSDictionary<NSString *, id> * _Nullable)query
                       completionHandler:(AccountitAPICPAAdminMemberListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/members"
                                  query:query
                                   body:nil
                          responseClass:[AccountitAPICPAAdminMemberListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminPersonalVerificationRequestsWithCompletionHandler:(AccountitAPICPAPersonalVerificationRequestListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/cpa-verification-requests"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAPersonalVerificationRequestListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminApprovePersonalVerificationRequestWithID:(NSString * _Nonnull)requestID
                                                           body:(NSDictionary<NSString *, id> * _Nonnull)body
                                              completionHandler:(AccountitAPICPAPersonalVerificationRequestItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/cpa-verification-requests/%@/approve", [AccountitAPIService _escapedPathComponent:requestID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAPersonalVerificationRequestItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminRejectPersonalVerificationRequestWithID:(NSString * _Nonnull)requestID
                                                          body:(NSDictionary<NSString *, id> * _Nonnull)body
                                             completionHandler:(AccountitAPICPAPersonalVerificationRequestItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/cpa-verification-requests/%@/reject", [AccountitAPIService _escapedPathComponent:requestID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAPersonalVerificationRequestItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminJobSubmissionsWithCompletionHandler:(AccountitAPICPAJobSubmissionListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/job-submissions"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPAJobSubmissionListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminApproveJobSubmissionWithID:(NSString * _Nonnull)submissionID
                                              body:(NSDictionary<NSString *, id> * _Nonnull)body
                                 completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/job-submissions/%@/approve", [AccountitAPIService _escapedPathComponent:submissionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAJobSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminRejectJobSubmissionWithID:(NSString * _Nonnull)submissionID
                                             body:(NSDictionary<NSString *, id> * _Nonnull)body
                                completionHandler:(AccountitAPICPAJobSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/job-submissions/%@/reject", [AccountitAPIService _escapedPathComponent:submissionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPAJobSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminProfileSubmissionsWithCompletionHandler:(AccountitAPICPACompanyProfileSubmissionListResponseCompletionHandler _Nonnull)completionHandler {
    return [AccountitAPIService _JSONRequestWithMethod:@"GET"
                                   path:@"/admin/profile-submissions"
                                  query:nil
                                   body:nil
                          responseClass:[AccountitAPICPACompanyProfileSubmissionListResponse class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminApproveProfileSubmissionWithID:(NSString * _Nonnull)submissionID
                                                 body:(NSDictionary<NSString *, id> * _Nonnull)body
                                    completionHandler:(AccountitAPICPACompanyProfileSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/profile-submissions/%@/approve", [AccountitAPIService _escapedPathComponent:submissionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACompanyProfileSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaAdminRejectProfileSubmissionWithID:(NSString * _Nonnull)submissionID
                                                body:(NSDictionary<NSString *, id> * _Nonnull)body
                                   completionHandler:(AccountitAPICPACompanyProfileSubmissionItemCompletionHandler _Nonnull)completionHandler {
    NSString *path = [AccountitAPIService _pathWithFormat:@"/admin/profile-submissions/%@/reject", [AccountitAPIService _escapedPathComponent:submissionID]];

    return [AccountitAPIService _JSONRequestWithMethod:@"PATCH"
                                   path:path
                                  query:nil
                                   body:body
                          responseClass:[AccountitAPICPACompanyProfileSubmissionItem class]
                      completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];
}

+ (NSProgress * _Nonnull)cpaOpsDeployWithBody:(NSDictionary<NSString *, id> * _Nonnull)body
                         bearerToken:(NSString * _Nonnull)bearerToken
                    completionHandler:(AccountitAPICPAOpsDeployResponseCompletionHandler _Nonnull)completionHandler {
    NSString *authorization = [[NSString alloc] initWithFormat:@"Bearer %@", bearerToken];
    NSDictionary *headers = [[NSDictionary alloc] initWithObjectsAndKeys:authorization, @"Authorization", nil];
    [authorization release];

    NSProgress *progress = [AccountitAPIService _requestWithMethod:@"POST"
                                               path:@"/ops/deploy"
                                              query:nil
                                               body:body
                                            rawBody:nil
                                     rawContentType:nil
                                            headers:headers
                                      responseClass:[AccountitAPICPAOpsDeployResponse class]
                                  completionHandler:(_AccountitAPIServiceCompletionHandler)completionHandler];

    [headers release];

    return progress;
}

@end
