declare module 'react-native-recyclerview-list' {
  import { ViewProps } from 'react-native';

  interface Props extends ViewProps {
    dataSource: DataSource<any>;
    renderItem(params: { item: any; index: number }): void;
    ItemSeparatorComponent?: JSX.Element;
    itemAnimatorEnabled?: boolean;
    inverted?: boolean;
  }

  export class DataSource<T> {
    constructor(data: T[], keyExtractor: (item: T) => void);
    splice(start: number, deleteCount: number, ...items: T[]): void;
    unshift(item: T): void;
  }

  class RecyclerviewList extends React.Component<Props> {
    scrollToIndex(options: {
      index: number;
      animated?: boolean;
      velocity?: number;
      viewPosition?: number;
      viewOffset?: number;
    }): void;
  }
  export default RecyclerviewList;
}
