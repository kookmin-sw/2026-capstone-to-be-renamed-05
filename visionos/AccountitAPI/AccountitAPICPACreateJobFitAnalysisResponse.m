#import <AccountitAPI/AccountitAPICPACreateJobFitAnalysisResponse.h>
#import <AccountitAPI/AccountitAPICPAJobFitAnalysisListResponse.h>

@implementation AccountitAPICPACreateJobFitAnalysisResponse

- (AccountitAPICPAJobFitAnalysisItem * _Nonnull)item {
    AccountitAPICPAJobFitAnalysisItem *DTO = (AccountitAPICPAJobFitAnalysisItem *)[self DTOForKey:@"item" class:[AccountitAPICPAJobFitAnalysisItem class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPAJobFitAnalysisItem *emptyDTO = [[AccountitAPICPAJobFitAnalysisItem alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

- (BOOL)reused {
    return [self boolForKey:@"reused" defaultValue:NO];
}

@end
