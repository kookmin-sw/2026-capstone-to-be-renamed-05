#import <AccountitAPI/AccountitAPIDTO.h>

@interface AccountitAPIDTO () {
    NSDictionary<NSString *, id> * _Nonnull _rawDictionary;
}

+ (id _Nullable)_nullToNil:(id _Nullable)value __attribute__((objc_direct));
+ (NSDictionary<NSString *, id> * _Nonnull)_safeDictionary:(id _Nullable)value __attribute__((objc_direct));
+ (NSString * _Nullable)_stringValue:(id _Nullable)value __attribute__((objc_direct));
+ (NSNumber * _Nullable)_numberValue:(id _Nullable)value __attribute__((objc_direct));

@end

@implementation AccountitAPIDTO

@synthesize rawDictionary = _rawDictionary;

+ (BOOL)supportsSecureCoding {
    return YES;
}

+ (id _Nullable)_nullToNil:(id _Nullable)value __attribute__((objc_direct)) {
    if ([value isKindOfClass:[NSNull class]]) {
        return nil;
    }

    return value;
}

+ (NSDictionary<NSString *, id> * _Nonnull)_safeDictionary:(id _Nullable)value __attribute__((objc_direct)) {
    if ([value isKindOfClass:[NSDictionary class]]) {
        return (NSDictionary<NSString *, id> *)value;
    }

    NSDictionary<NSString *, id> *dictionary = [[NSDictionary alloc] init];
    return [dictionary autorelease];
}

+ (NSString * _Nullable)_stringValue:(id _Nullable)value __attribute__((objc_direct)) {
    id safeValue = [AccountitAPIDTO _nullToNil:value];

    if ([safeValue isKindOfClass:[NSString class]]) {
        return safeValue;
    }

    if ([safeValue isKindOfClass:[NSNumber class]]) {
        return [(NSNumber *)safeValue stringValue];
    }

    return nil;
}

+ (NSNumber * _Nullable)_numberValue:(id _Nullable)value __attribute__((objc_direct)) {
    id safeValue = [AccountitAPIDTO _nullToNil:value];

    if ([safeValue isKindOfClass:[NSNumber class]]) {
        return safeValue;
    }

    if ([safeValue isKindOfClass:[NSString class]]) {
        NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
        NSNumber *number = [[formatter numberFromString:(NSString *)safeValue] retain];

        [formatter release];

        return [number autorelease];
    }

    return nil;
}

- (instancetype _Nonnull)initWithDictionary:(NSDictionary<NSString *, id> * _Nonnull)dictionary {
    self = [super init];

    if (self) {
        _rawDictionary = [[AccountitAPIDTO _safeDictionary:dictionary] copy];
    }

    return self;
}

- (instancetype _Nullable)initWithCoder:(NSCoder * _Nonnull)coder {
    NSSet *classes = [[NSSet alloc] initWithObjects:
                      [NSDictionary class],
                      [NSArray class],
                      [NSString class],
                      [NSNumber class],
                      [NSNull class],
                      nil];
    NSDictionary *dictionary = [[coder decodeObjectOfClasses:classes forKey:@"rawDictionary"] retain];
    [classes release];

    self = [self initWithDictionary:[AccountitAPIDTO _safeDictionary:dictionary]];
    [dictionary release];

    return self;
}

- (void)encodeWithCoder:(NSCoder * _Nonnull)coder {
    [coder encodeObject:_rawDictionary forKey:@"rawDictionary"];
}

- (id _Nonnull)copyWithZone:(NSZone * _Nullable)zone {
    return [[[self class] allocWithZone:zone] initWithDictionary:_rawDictionary];
}

- (void)dealloc {
    [_rawDictionary release];
    [super dealloc];
}

- (NSString * _Nullable)stringForKey:(NSString * _Nonnull)key {
    return [AccountitAPIDTO _stringValue:[_rawDictionary objectForKey:key]];
}

- (NSNumber * _Nullable)numberForKey:(NSString * _Nonnull)key {
    return [AccountitAPIDTO _numberValue:[_rawDictionary objectForKey:key]];
}

- (BOOL)boolForKey:(NSString * _Nonnull)key defaultValue:(BOOL)defaultValue {
    NSNumber *number = [self numberForKey:key];

    if (!number) {
        return defaultValue;
    }

    return [number boolValue];
}

- (NSDictionary<NSString *, id> * _Nullable)dictionaryForKey:(NSString * _Nonnull)key {
    id value = [AccountitAPIDTO _nullToNil:[_rawDictionary objectForKey:key]];

    if (![value isKindOfClass:[NSDictionary class]]) {
        return nil;
    }

    return value;
}

- (NSArray * _Nullable)arrayForKey:(NSString * _Nonnull)key {
    id value = [AccountitAPIDTO _nullToNil:[_rawDictionary objectForKey:key]];

    if (![value isKindOfClass:[NSArray class]]) {
        return nil;
    }

    return value;
}

- (AccountitAPIDTO * _Nullable)DTOForKey:(NSString * _Nonnull)key class:(Class _Nonnull)DTOClass {
    NSDictionary *dictionary = [self dictionaryForKey:key];

    if (!dictionary || ![DTOClass isSubclassOfClass:[AccountitAPIDTO class]]) {
        return nil;
    }

    AccountitAPIDTO *DTO = [[DTOClass alloc] initWithDictionary:dictionary];
    return [DTO autorelease];
}

- (NSArray<AccountitAPIDTO *> * _Nonnull)arrayForKey:(NSString * _Nonnull)key itemClass:(Class _Nonnull)itemClass {
    NSArray *rawItems = [self arrayForKey:key];

    if (!rawItems || ![itemClass isSubclassOfClass:[AccountitAPIDTO class]]) {
        NSArray *items = [[NSArray alloc] init];
        return [items autorelease];
    }

    NSMutableArray *items = [[NSMutableArray alloc] initWithCapacity:[rawItems count]];

    for (id rawItem in rawItems) {
        if (![rawItem isKindOfClass:[NSDictionary class]]) {
            continue;
        }

        AccountitAPIDTO *item = [[itemClass alloc] initWithDictionary:rawItem];
        [items addObject:item];
        [item release];
    }

    return [items autorelease];
}

@end

@interface AccountitAPICollectionResponse () {
    NSArray<AccountitAPIDTO *> * _Nonnull _items;
    NSInteger _total;
    NSInteger _page;
    NSInteger _pageSize;
    NSInteger _limit;
    NSInteger _offset;
}

@property (nonatomic, copy, readonly) NSArray<AccountitAPIDTO *> *items;

@end

@implementation AccountitAPICollectionResponse

@synthesize items = _items;
@synthesize total = _total;
@synthesize page = _page;
@synthesize pageSize = _pageSize;
@synthesize limit = _limit;
@synthesize offset = _offset;

+ (Class _Nonnull)itemClass {
    return [AccountitAPIDTO class];
}

- (instancetype _Nonnull)initWithDictionary:(NSDictionary<NSString *, id> * _Nonnull)dictionary {
    self = [super initWithDictionary:dictionary];

    if (self) {
        _items = [[self arrayForKey:@"items" itemClass:[[self class] itemClass]] copy];

        NSNumber *total = [self numberForKey:@"total"];
        NSNumber *page = [self numberForKey:@"page"];
        NSNumber *pageSize = [self numberForKey:@"pageSize"];
        NSNumber *limit = [self numberForKey:@"limit"];
        NSNumber *offset = [self numberForKey:@"offset"];

        _total = total ? [total integerValue] : (NSInteger)[_items count];
        _page = page ? [page integerValue] : 0;
        _pageSize = pageSize ? [pageSize integerValue] : 0;
        _limit = limit ? [limit integerValue] : 0;
        _offset = offset ? [offset integerValue] : 0;
    }

    return self;
}

- (void)dealloc {
    [_items release];
    [super dealloc];
}

@end
