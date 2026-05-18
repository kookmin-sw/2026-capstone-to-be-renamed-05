//
//  JobsViewModel.m
//  Accountit
//
//  Created by Jinwoo Kim on 5/17/26.
//

#import "JobsViewModel.h"
#import <AccountitAPI/AccountitAPI.h>

@interface JobsViewModel ()
@property (retain, nonatomic, readonly) UICollectionViewDiffableDataSource<NSString *,JobItemModel *> *dataSource;
@property (retain, nonatomic, nullable) NSProgress *progress;
@end

@implementation JobsViewModel

- (instancetype)initWithDataSource:(UICollectionViewDiffableDataSource<NSString *,JobItemModel *> *)dataSource {
    if (self = [super init]) {
        self->_dataSource = [dataSource retain];
    }
    
    return self;
}

- (void)dealloc {
    [_dataSource release];
    [_progress cancel];
    [_progress release];
    [super dealloc];
}

- (void)loadDataSource {
    [self.progress cancel];
    
    self.progress = [AccountitAPIService cpaJobsWithQuery:nil completionHandler:^(AccountitAPICPAJobListResponse * _Nullable response, NSError * _Nullable * _Nullable error) {
        assert(error == nil);
        NSMutableArray<JobItemModel *> *items = [[NSMutableArray alloc] initWithCapacity:response.items.count];
        
        for (AccountitAPICPAJobListItem *item in response.items) {
            JobItemModel *itemModel = [[JobItemModel alloc] initWithItem:item];
            [items addObject:itemModel];
            [itemModel release];
        }
        
        NSDiffableDataSourceSnapshot<NSString *, JobItemModel *> *snapshot = [[NSDiffableDataSourceSnapshot alloc] init];
        [snapshot appendSectionsWithIdentifiers:@[@"0"]];
        [snapshot appendItemsWithIdentifiers:items intoSectionWithIdentifier:@"0"];
        [items release];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            [self.dataSource applySnapshot:snapshot animatingDifferences:YES];
        });
        
        [snapshot release];
    }];
}

@end
