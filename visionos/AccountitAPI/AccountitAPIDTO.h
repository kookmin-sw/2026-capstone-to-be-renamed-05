#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface AccountitAPIDTO : NSObject <NSSecureCoding, NSCopying>

@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *rawDictionary;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDictionary:(NSDictionary<NSString *, id> *)dictionary NS_DESIGNATED_INITIALIZER;
- (nullable NSString *)stringForKey:(NSString *)key;
- (nullable NSNumber *)numberForKey:(NSString *)key;
- (BOOL)boolForKey:(NSString *)key defaultValue:(BOOL)defaultValue;
- (nullable NSDictionary<NSString *, id> *)dictionaryForKey:(NSString *)key;
- (nullable NSArray *)arrayForKey:(NSString *)key;
- (nullable AccountitAPIDTO *)DTOForKey:(NSString *)key class:(Class)DTOClass;
- (NSArray<AccountitAPIDTO *> *)arrayForKey:(NSString *)key itemClass:(Class)itemClass;

@end

@interface AccountitAPICollectionResponse : AccountitAPIDTO

@property (nonatomic, assign, readonly) NSInteger total;
@property (nonatomic, assign, readonly) NSInteger page;
@property (nonatomic, assign, readonly) NSInteger pageSize;
@property (nonatomic, assign, readonly) NSInteger limit;
@property (nonatomic, assign, readonly) NSInteger offset;

+ (Class)itemClass;

@end

NS_ASSUME_NONNULL_END
