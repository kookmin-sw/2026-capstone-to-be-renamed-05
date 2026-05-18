//
//  JobItemModel.h
//  Accountit
//
//  Created by Jinwoo Kim on 5/18/26.
//

#import <AccountitAPI/AccountitAPI.h>

NS_ASSUME_NONNULL_BEGIN

@interface JobItemModel : NSObject
+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithItem:(AccountitAPICPAJobListItem *)item;
@property (copy, nonatomic, readonly) NSString *title;
@end

NS_ASSUME_NONNULL_END
