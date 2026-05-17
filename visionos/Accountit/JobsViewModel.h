//
//  JobsViewModel.h
//  Accountit
//
//  Created by Jinwoo Kim on 5/17/26.
//

#import <UIKit/UIKit.h>
#import "JobItemModel.h"

NS_ASSUME_NONNULL_BEGIN

@interface JobsViewModel : NSObject
+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithDataSource:(UICollectionViewDiffableDataSource<NSString *, JobItemModel *> *)dataSource;
- (void)loadDataSource;
@end

NS_ASSUME_NONNULL_END
