//
//  JobItemModel.m
//  Accountit
//
//  Created by Jinwoo Kim on 5/18/26.
//

#import "JobItemModel.h"

@interface JobItemModel ()
@property (copy, nonatomic, readonly) AccountitAPICPAJobListItem *item;
@end

@implementation JobItemModel

- (instancetype)initWithItem:(AccountitAPICPAJobListItem *)item {
    if (self = [super init]) {
        self->_item = [item copy];
    }

    return self;
}

- (void)dealloc {
    [_item release];
    [super dealloc];
}

- (NSString *)title {
    return self.item.title;
}

- (BOOL)isEqual:(id)other {
    if (other == self) {
        return YES;
    } else if ([other isKindOfClass:[JobItemModel class]]) {
        JobItemModel *casted = (JobItemModel *)other;
        return [self.item.identifier isEqualToString:casted.item.identifier];
    } else {
        return NO;
    }
}

- (NSUInteger)hash {
    return self.item.identifier.hash;
}

@end
