#import <AccountitAPI/AccountitAPICPAAssetCompletionResponse.h>

@implementation AccountitAPICPAAssetItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)publicUrl {
    NSString *value = [self stringForKey:@"publicUrl"];

    if (!value) {
        return @"";
    }

    return value;
}

@end

@implementation AccountitAPICPAAssetCompletionResponse

- (AccountitAPICPAAssetItem * _Nonnull)asset {
    AccountitAPICPAAssetItem *DTO = (AccountitAPICPAAssetItem *)[self DTOForKey:@"asset" class:[AccountitAPICPAAssetItem class]];

    if (DTO) {
        return DTO;
    }

    NSDictionary<NSString *, id> *emptyDictionary = [[NSDictionary alloc] init];
    AccountitAPICPAAssetItem *emptyDTO = [[AccountitAPICPAAssetItem alloc] initWithDictionary:emptyDictionary];

    [emptyDictionary release];

    return [emptyDTO autorelease];
}

@end
