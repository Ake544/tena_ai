import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../constants/theme';
import Spinner from '../components/Spinner';

export default function Index() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    SecureStore.getItemAsync('access_token').then(setToken);
  }, []);

  if (token === undefined) {
    return (
      <View style={styles.loading}>
        <Spinner color={colors.primary} />
      </View>
    );
  }

  return token ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/splash" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
