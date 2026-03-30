import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUi } from './ui';

type Props = ScrollViewProps & {
  children: React.ReactNode;
};

export function ScreenContainer({ children, contentContainerStyle, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  const ui = useUi();
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: ui.pageBg }]}>
      <ScrollView
        {...rest}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
});
