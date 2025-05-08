import { Link, Stack } from 'expo-router';
import { StyleSheet, Image } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Welcome to Guri!' }} />
      <View style={styles.container}>
        {/* Logo */}
        <Image
          source={require('../assets/button_images/guri_logo_c.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Press tap the arrow on the top left to continue! Guri Guri~!</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
