#import <AccountitAPI/AccountitAPICPAMyProfileResponse.h>
#import <AccountitAPI/AccountitAPICPAPersonalVerificationRequestListResponse.h>

@implementation AccountitAPICPAMyProfileResponse

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)username {
    NSString *value = [self stringForKey:@"username"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)displayName {
    return [self stringForKey:@"displayName"];
}

- (NSString * _Nullable)profileImageUrl {
    return [self stringForKey:@"profileImageUrl"];
}

- (NSString * _Nonnull)role {
    NSString *value = [self stringForKey:@"role"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)createdAt {
    NSString *value = [self stringForKey:@"createdAt"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)cpaVerificationStatus {
    NSString *value = [self stringForKey:@"cpaVerificationStatus"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)careerStage {
    return [self stringForKey:@"careerStage"];
}

- (NSString * _Nonnull)employmentHistoryStatus {
    NSString *value = [self stringForKey:@"employmentHistoryStatus"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nullable)verifiedAt {
    return [self stringForKey:@"verifiedAt"];
}

- (BOOL)traineeRoomAccess {
    return [self boolForKey:@"traineeRoomAccess" defaultValue:NO];
}

- (AccountitAPICPAPersonalVerificationRequestItem * _Nullable)pendingVerificationRequest {
    AccountitAPICPAPersonalVerificationRequestItem *DTO = (AccountitAPICPAPersonalVerificationRequestItem *)[self DTOForKey:@"pendingVerificationRequest" class:[AccountitAPICPAPersonalVerificationRequestItem class]];
    return DTO;
}

@end
