#import <AccountitAPI/AccountitAPICPAJobFitAnalysisListResponse.h>

@implementation AccountitAPICPAJobFitAnalysisItem

- (NSString * _Nonnull)identifier {
    NSString *value = [self stringForKey:@"id"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)jobId {
    NSString *value = [self stringForKey:@"jobId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)jobTitle {
    NSString *value = [self stringForKey:@"jobTitle"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)companyId {
    NSString *value = [self stringForKey:@"companyId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)companyName {
    NSString *value = [self stringForKey:@"companyName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)resumeId {
    NSString *value = [self stringForKey:@"resumeId"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSString * _Nonnull)resumeFileName {
    NSString *value = [self stringForKey:@"resumeFileName"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSInteger)fitScore {
    NSNumber *number = [self numberForKey:@"fitScore"];

    if (!number) {
        return 0;
    }

    return [number integerValue];
}

- (NSString * _Nonnull)summary {
    NSString *value = [self stringForKey:@"summary"];

    if (!value) {
        return @"";
    }

    return value;
}

- (NSArray<NSString *> * _Nonnull)strengths {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"strengths"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSArray<NSString *> * _Nonnull)companyPriorities {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"companyPriorities"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSArray<NSString *> * _Nonnull)gaps {
    NSArray<NSString *> *array = (NSArray<NSString *> *)[self arrayForKey:@"gaps"];

    if (array) {
        return array;
    }

    NSArray<NSString *> *emptyArray = [[NSArray alloc] init];
    return [emptyArray autorelease];
}

- (NSString * _Nonnull)recommendation {
    NSString *value = [self stringForKey:@"recommendation"];

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

- (NSString * _Nonnull)updatedAt {
    NSString *value = [self stringForKey:@"updatedAt"];

    if (!value) {
        return @"";
    }

    return value;
}

@end

@implementation AccountitAPICPAJobFitAnalysisListResponse

@dynamic items;

+ (Class _Nonnull)itemClass {
    return [AccountitAPICPAJobFitAnalysisItem class];
}

@end
