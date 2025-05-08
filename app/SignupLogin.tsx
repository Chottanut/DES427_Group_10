import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { SupabaseClient } from '@supabase/supabase-js';

type Props = {
  loginCB: () => void;
  supabase: SupabaseClient;
};

const SignupLogin: React.FC<Props> = ({ loginCB, supabase }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // 👈 Added for U_Name

  const toggleMode = () => setIsLogin((prev) => !prev);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      loginCB();
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Signup Error', 'Passwords do not match.');
      return;
    }
  
    const { data, error } = await supabase.auth.signUp({ email, password });
  
    if (error) {
      Alert.alert('Signup Failed', error.message);
      return;
    }
  
    const user = data.user;
    if (user) {
      const { error: dbError } = await supabase.from('User').insert([
        {
          U_id: user.id,
          U_Email: email,
          U_Password: password,
          U_Name: name || '',
        },
      ]);
  
      if (dbError) {
        Alert.alert('Database Error', dbError.message);
      } else {
        Alert.alert('Signup Successful');
        setIsLogin(true);
      }
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Signup'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            value={name}
            onChangeText={setName}
          />
        </>
      )}
      <Button
        title={isLogin ? 'Log In' : 'Sign Up'}
        onPress={isLogin ? handleLogin : handleSignup}
      />
      <TouchableOpacity onPress={toggleMode}>
        <Text style={styles.switchText}>
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupLogin;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  switchText: {
    color: '#007aff',
    marginTop: 15,
    fontSize: 16,
  },
});