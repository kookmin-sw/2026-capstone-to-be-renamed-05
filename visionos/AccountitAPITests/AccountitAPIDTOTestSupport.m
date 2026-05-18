#import "AccountitAPIDTOTestSupport.h"

@implementation AccountitAPIDTOTestSupport

+ (NSDictionary<NSString *, id> *)sampleDictionaryForDTOClass:(Class)DTOClass {
    if ([DTOClass isSubclassOfClass:[AccountitAPICollectionResponse class]]) {
        return @{
            @"items": @[
                @{
                    @"id": @"item-1",
                    @"title": @"Sample Item"
                }
            ],
            @"total": @1,
            @"page": @2,
            @"pageSize": @20,
            @"limit": @20,
            @"offset": @40
        };
    }

    if (DTOClass == [AccountitAPIErrorDetail class]) {
        return @{
            @"field": @"email",
            @"message": @"must be valid"
        };
    }

    if (DTOClass == [AccountitAPIErrorResponse class]) {
        return @{
            @"statusCode": @400,
            @"errorCode": @"VALIDATION_ERROR",
            @"message": @"Request validation failed",
            @"path": @"/jobs",
            @"timestamp": @"2026-05-17T00:00:00.000Z",
            @"details": @[
                @{
                    @"field": @"email",
                    @"message": @"must be valid"
                }
            ]
        };
    }

    if (DTOClass == [AccountitAPIEmptyResponse class]) {
        return @{
            @"ok": @YES
        };
    }

    return @{
        @"id": @"sample-id",
        @"title": @"Sample Title",
        @"enabled": @YES,
        @"count": @7,
        @"nested": @{
            @"id": @"nested-id"
        },
        @"items": @[
            @{
                @"id": @"child-id"
            }
        ]
    };
}

+ (NSSet *)allowedClassesForDTOClass:(Class)DTOClass {
    NSMutableSet *classes = [[NSMutableSet alloc] initWithObjects:
                             DTOClass,
                             [AccountitAPIDTO class],
                             [AccountitAPICollectionResponse class],
                             [NSDictionary class],
                             [NSArray class],
                             [NSString class],
                             [NSNumber class],
                             [NSNull class],
                             nil];

    if ([DTOClass isSubclassOfClass:[AccountitAPICollectionResponse class]]) {
        Class itemClass = [DTOClass itemClass];

        if (itemClass) {
            [classes addObject:itemClass];
        }
    }

    NSSet *result = [[NSSet alloc] initWithSet:classes];
    [classes release];

    return [result autorelease];
}

+ (NSArray<AccountitAPIDTO *> *)collectionItemsForDTO:(AccountitAPICollectionResponse *)DTO {
    id value = [DTO valueForKey:@"items"];

    if (![value isKindOfClass:[NSArray class]]) {
        return nil;
    }

    return (NSArray<AccountitAPIDTO *> *)value;
}

+ (void)assertDTO:(AccountitAPIDTO *)DTO
       matchesClass:(Class)DTOClass
       dictionary:(NSDictionary<NSString *, id> *)dictionary {
    XCTAssertNotNil(DTO);
    XCTAssertTrue([DTO isKindOfClass:DTOClass]);
    XCTAssertEqualObjects([DTO rawDictionary], dictionary);
    XCTAssertEqualObjects([DTO stringForKey:@"id"], [dictionary objectForKey:@"id"]);
    XCTAssertEqualObjects([DTO stringForKey:@"title"], [dictionary objectForKey:@"title"]);
    XCTAssertEqualObjects([DTO numberForKey:@"count"], [dictionary objectForKey:@"count"]);
    XCTAssertEqual([DTO boolForKey:@"enabled" defaultValue:NO], YES);
    XCTAssertEqualObjects([DTO dictionaryForKey:@"nested"], [dictionary objectForKey:@"nested"]);
    XCTAssertEqualObjects([DTO arrayForKey:@"items"], [dictionary objectForKey:@"items"]);
}

+ (void)assertCollectionDTO:(AccountitAPICollectionResponse *)DTO
              matchesClass:(Class)DTOClass {
    Class itemClass = [DTOClass itemClass];
    NSArray<AccountitAPIDTO *> *items = [self collectionItemsForDTO:DTO];
    AccountitAPIDTO *firstItem = nil;

    if ([items count] > 0) {
        firstItem = [items objectAtIndex:0];
    }

    XCTAssertEqual([items count], 1U);
    XCTAssertTrue([firstItem isKindOfClass:itemClass]);
    XCTAssertEqualObjects([firstItem stringForKey:@"id"], @"item-1");
    XCTAssertEqualObjects([firstItem stringForKey:@"title"], @"Sample Item");
    XCTAssertEqual([DTO total], 1);
    XCTAssertEqual([DTO page], 2);
    XCTAssertEqual([DTO pageSize], 20);
    XCTAssertEqual([DTO limit], 20);
    XCTAssertEqual([DTO offset], 40);
}

+ (void)assertErrorDetailDTO:(AccountitAPIErrorDetail *)DTO {
    XCTAssertEqualObjects([DTO field], @"email");
    XCTAssertEqualObjects([DTO message], @"must be valid");
}

+ (void)assertErrorResponseDTO:(AccountitAPIErrorResponse *)DTO {
    XCTAssertEqual([DTO statusCode], 400);
    XCTAssertEqualObjects([DTO errorCode], @"VALIDATION_ERROR");
    XCTAssertEqualObjects([DTO message], @"Request validation failed");
    XCTAssertEqualObjects([DTO path], @"/jobs");
    XCTAssertEqualObjects([DTO timestamp], @"2026-05-17T00:00:00.000Z");
    XCTAssertEqual([[DTO details] count], 1U);
    XCTAssertTrue([[[DTO details] objectAtIndex:0] isKindOfClass:[AccountitAPIErrorDetail class]]);
    [self assertErrorDetailDTO:[[DTO details] objectAtIndex:0]];
}

+ (void)assertTypedValuesForDTO:(AccountitAPIDTO *)DTO
                       DTOClass:(Class)DTOClass
                     dictionary:(NSDictionary<NSString *, id> *)dictionary {
    if ([DTOClass isSubclassOfClass:[AccountitAPICollectionResponse class]]) {
        [self assertCollectionDTO:(AccountitAPICollectionResponse *)DTO matchesClass:DTOClass];
        return;
    }

    if (DTOClass == [AccountitAPIErrorDetail class]) {
        [self assertErrorDetailDTO:(AccountitAPIErrorDetail *)DTO];
        return;
    }

    if (DTOClass == [AccountitAPIErrorResponse class]) {
        [self assertErrorResponseDTO:(AccountitAPIErrorResponse *)DTO];
        return;
    }

    if (DTOClass == [AccountitAPIEmptyResponse class]) {
        AccountitAPIEmptyResponse *emptyResponse = (AccountitAPIEmptyResponse *)DTO;

        XCTAssertTrue([emptyResponse ok]);
        return;
    }

    [self assertDTO:DTO matchesClass:DTOClass dictionary:dictionary];
}

+ (void)assertCopyingAndSecureCodingRoundTripForDTOClass:(Class)DTOClass {
    XCTAssertNotNil(DTOClass);
    XCTAssertTrue([DTOClass isSubclassOfClass:[AccountitAPIDTO class]]);
    XCTAssertTrue([DTOClass conformsToProtocol:@protocol(NSCoding)]);
    XCTAssertTrue([DTOClass conformsToProtocol:@protocol(NSSecureCoding)]);
    XCTAssertTrue([DTOClass conformsToProtocol:@protocol(NSCopying)]);
    XCTAssertTrue([DTOClass supportsSecureCoding]);

    NSDictionary<NSString *, id> *dictionary = [self sampleDictionaryForDTOClass:DTOClass];
    AccountitAPIDTO *object = [[DTOClass alloc] initWithDictionary:dictionary];
    AccountitAPIDTO *copy = [object copy];

    [self assertTypedValuesForDTO:object DTOClass:DTOClass dictionary:dictionary];
    XCTAssertNotEqual(object, copy);
    [self assertTypedValuesForDTO:copy DTOClass:DTOClass dictionary:dictionary];

    NSError *archiveError = nil;
    NSData *archiveData = [NSKeyedArchiver archivedDataWithRootObject:object
                                                requiringSecureCoding:YES
                                                                error:&archiveError];
    XCTAssertNil(archiveError);
    XCTAssertNotNil(archiveData);

    NSError *unarchiveError = nil;
    AccountitAPIDTO *unarchived = [NSKeyedUnarchiver unarchivedObjectOfClasses:[self allowedClassesForDTOClass:DTOClass]
                                                                      fromData:archiveData
                                                                         error:&unarchiveError];

    XCTAssertNil(unarchiveError);
    [self assertTypedValuesForDTO:unarchived DTOClass:DTOClass dictionary:dictionary];

    [copy release];
    [object release];
}

@end
