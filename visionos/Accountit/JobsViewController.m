//
//  JobsViewController.m
//  Accountit
//
//  Created by Jinwoo Kim on 5/17/26.
//

#import "JobsViewController.h"
#import "JobsViewModel.h"

@interface JobsViewController ()
@property (retain, nonatomic, readonly) UICollectionView *collectionView;
@property (retain, nonatomic, readonly) UICollectionViewDiffableDataSource<NSString *, JobItemModel *> *dataSource;
@property (retain, nonatomic, readonly) JobsViewModel *viewModel;
@property (retain, nonatomic, readonly) UICollectionViewCellRegistration *cellRegistration;
@end

@implementation JobsViewController
@synthesize collectionView = _collectionView;
@synthesize dataSource = _dataSource;
@synthesize viewModel = _viewModel;
@synthesize cellRegistration = _cellRegistration;

- (void)dealloc {
    [_collectionView release];
    [_dataSource release];
    [_viewModel release];
[_cellRegistration release];
    [super dealloc];
}

- (void)loadView {
    self.view = self.collectionView;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    [self.viewModel loadDataSource];
}

- (UICollectionView *)collectionView {
    UICollectionView *collectionView = self->_collectionView;
    if (collectionView) return collectionView;

    UICollectionLayoutListConfiguration *configuration = [[UICollectionLayoutListConfiguration alloc] initWithAppearance:UICollectionLayoutListAppearanceInsetGrouped];
    UICollectionViewCompositionalLayout *collectionViewLayout = [UICollectionViewCompositionalLayout layoutWithListConfiguration:configuration];
    [configuration release];
    collectionView = [[UICollectionView alloc] initWithFrame:CGRectNull collectionViewLayout:collectionViewLayout];

    self->_collectionView = collectionView;
    return collectionView;
}

- (UICollectionViewDiffableDataSource<NSString *, JobItemModel *> *)dataSource {
    UICollectionViewDiffableDataSource *dataSource = self->_dataSource;
    if (dataSource) return dataSource;

    UICollectionViewCellRegistration *cellRegistration = self.cellRegistration;

    dataSource = [[UICollectionViewDiffableDataSource alloc] initWithCollectionView:self.collectionView cellProvider:^UICollectionViewCell * _Nullable(UICollectionView * _Nonnull collectionView, NSIndexPath * _Nonnull indexPath, id  _Nonnull itemIdentifier) {
        return [collectionView dequeueConfiguredReusableCellWithRegistration:cellRegistration forIndexPath:indexPath item:itemIdentifier];
    }];

    self->_dataSource = dataSource;
    return dataSource;
}

- (JobsViewModel *)viewModel {
    JobsViewModel *viewModel = self->_viewModel;
    if (viewModel) return viewModel;

    viewModel = [[JobsViewModel alloc] initWithDataSource:self.dataSource];
    self->_viewModel = viewModel;
    return viewModel;
}

- (UICollectionViewCellRegistration *)cellRegistration {
    UICollectionViewCellRegistration *cellRegistration = self->_cellRegistration;
    if (cellRegistration) return cellRegistration;

    cellRegistration = [UICollectionViewCellRegistration registrationWithCellClass:[UICollectionViewListCell class] configurationHandler:^(UICollectionViewListCell * _Nonnull cell, NSIndexPath * _Nonnull indexPath, JobItemModel * _Nonnull item) {
        UIListContentConfiguration *contentConfiguration = [cell defaultContentConfiguration];
        contentConfiguration.text = item.title;
        cell.contentConfiguration = contentConfiguration;
    }];

    self->_cellRegistration = [cellRegistration retain];
    return cellRegistration;
}

@end
